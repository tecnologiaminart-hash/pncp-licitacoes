// Serviço de orquestração: é a peça que transforma N chamadas independentes à API do PNCP
// (uma por palavra-chave) em uma única lista de licitações, sem duplicatas, filtrada e paginada.
// Porte da lógica que antes vivia no backend Express — agora roda inteira no navegador.
const PncpLicitacoesService = (() => {
  const MAX_PAGINAS_POR_PALAVRA = 3;
  const TAMANHO_PAGINA_UPSTREAM = 50;
  const CONCORRENCIA_MAXIMA = 5; // limita buscas simultâneas por palavra-chave, gentileza com o WAF do PNCP

  /**
   * Executa `tarefa` para cada item de `itens`, no máximo `limite` promessas em voo por vez.
   * Retorna resultados no mesmo formato de Promise.allSettled (preserva sucesso/falha por item).
   */
  async function executarComConcorrenciaLimitada(itens, limite, tarefa) {
    const resultados = new Array(itens.length);
    let proximoIndice = 0;

    async function worker() {
      while (proximoIndice < itens.length) {
        const indiceAtual = proximoIndice;
        proximoIndice += 1;
        try {
          const valor = await tarefa(itens[indiceAtual]);
          resultados[indiceAtual] = { status: 'fulfilled', value: valor };
        } catch (motivo) {
          resultados[indiceAtual] = { status: 'rejected', reason: motivo };
        }
      }
    }

    const workers = Array.from({ length: Math.min(limite, itens.length) }, () => worker());
    await Promise.all(workers);
    return resultados;
  }

  /**
   * Busca todas as páginas (até o limite configurado) de uma palavra-chave no PNCP.
   * Para de buscar mais páginas assim que uma página vier com menos itens que o solicitado,
   * pois isso indica que não há mais resultados adiante.
   */
  async function buscarTodasPaginasDaPalavra(palavraChave) {
    const licitacoes = [];
    for (let pagina = 1; pagina <= MAX_PAGINAS_POR_PALAVRA; pagina += 1) {
      // eslint-disable-next-line no-await-in-loop -- páginas de uma mesma palavra são sequenciais por natureza (paginação)
      const { items } = await PncpClient.buscarPorPalavraChave(palavraChave, pagina, TAMANHO_PAGINA_UPSTREAM);
      items.forEach((item) => licitacoes.push(PncpNormalize.normalizarLicitacao(item, palavraChave)));
      if (items.length < TAMANHO_PAGINA_UPSTREAM) break;
    }
    return licitacoes;
  }

  /**
   * Aplica os filtros de Estado (UF), modalidade, órgão e período sobre a lista já normalizada.
   */
  function aplicarFiltros(licitacoes, { uf, modalidade, orgao, dataInicial, dataFinal }) {
    return licitacoes.filter((licitacao) => {
      if (uf && licitacao.uf !== uf) return false;
      if (modalidade && licitacao.modalidade !== modalidade) return false;
      if (orgao && !PncpTexto.contemTexto(licitacao.orgao, orgao)) return false;

      if ((dataInicial || dataFinal) && licitacao.dataPublicacao) {
        const dataPub = licitacao.dataPublicacao.slice(0, 10); // "AAAA-MM-DD"
        if (dataInicial && dataPub < dataInicial) return false;
        if (dataFinal && dataPub > dataFinal) return false;
      }

      return true;
    });
  }

  /** Ordena a lista já filtrada de acordo com a opção escolhida pelo usuário. */
  function ordenarLicitacoes(licitacoes, ordenacao) {
    const comparadores = {
      data_desc: (a, b) => (b.dataPublicacao || '').localeCompare(a.dataPublicacao || ''),
      data_asc: (a, b) => (a.dataPublicacao || '').localeCompare(b.dataPublicacao || ''),
      titulo_asc: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
      titulo_desc: (a, b) => b.titulo.localeCompare(a.titulo, 'pt-BR'),
      orgao_asc: (a, b) => a.orgao.localeCompare(b.orgao, 'pt-BR'),
      orgao_desc: (a, b) => b.orgao.localeCompare(a.orgao, 'pt-BR'),
    };
    const comparador = comparadores[ordenacao] || comparadores.data_desc;
    return [...licitacoes].sort(comparador);
  }

  /**
   * Calcula a situação ("aberta", "encerra_hoje", "encerrada") de cada licitação em
   * relação ao momento atual e, se algum filtro de situação foi selecionado, remove
   * as que não se encaixam.
   */
  function classificarEFiltrarPorSituacao(licitacoes, situacoesSelecionadas) {
    const agoraStr = PncpSituacao.agoraNoBrasil();
    const comSituacao = licitacoes.map((licitacao) => ({
      ...licitacao,
      situacao: PncpSituacao.classificarSituacao(licitacao.dataFimVigencia, agoraStr),
    }));

    if (situacoesSelecionadas.length === 0) return comSituacao;
    return comSituacao.filter((licitacao) => situacoesSelecionadas.includes(licitacao.situacao));
  }

  /** Remove licitações duplicadas (mesma licitação encontrada por palavras-chave diferentes). */
  function removerDuplicadas(licitacoes) {
    const vistos = new Set();
    const unicas = [];
    for (const licitacao of licitacoes) {
      if (!vistos.has(licitacao.id)) {
        vistos.add(licitacao.id);
        unicas.push(licitacao);
      }
    }
    return unicas;
  }

  /**
   * Busca (com cache) o conjunto completo e já filtrado/deduplicado de licitações
   * para uma combinação de filtros. O resultado fica em cache por filtro (sem paginação),
   * permitindo que a navegação entre páginas não gere novas chamadas ao PNCP.
   */
  async function obterConjuntoFiltrado(filtros) {
    const chaveCache = PncpCache.montarChaveCache(filtros);
    const emCache = PncpCache.get(chaveCache);
    if (emCache) return emCache;

    const resultadosPorPalavra = await executarComConcorrenciaLimitada(
      filtros.palavrasChave,
      CONCORRENCIA_MAXIMA,
      (palavra) => buscarTodasPaginasDaPalavra(palavra),
    );

    const licitacoes = [];
    const keywordsComErro = [];
    resultadosPorPalavra.forEach((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        licitacoes.push(...resultado.value);
      } else {
        keywordsComErro.push(filtros.palavrasChave[indice]);
      }
    });

    if (licitacoes.length === 0 && keywordsComErro.length === filtros.palavrasChave.length) {
      throw new Error('Não foi possível consultar o PNCP no momento. Tente novamente em instantes.');
    }

    const unicas = removerDuplicadas(licitacoes);
    const filtradas = aplicarFiltros(unicas, filtros);

    const conjunto = { licitacoes: filtradas, keywordsComErro };
    PncpCache.set(chaveCache, conjunto);
    return conjunto;
  }

  /**
   * Ponto de entrada do serviço: aplica os filtros (com cache) e retorna a página solicitada.
   */
  async function buscarLicitacoes(filtros) {
    const { licitacoes, keywordsComErro } = await obterConjuntoFiltrado(filtros);
    const comSituacao = classificarEFiltrarPorSituacao(licitacoes, filtros.situacoes);
    const ordenadas = ordenarLicitacoes(comSituacao, filtros.ordenacao);

    const totalRegistros = ordenadas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / filtros.tamanhoPagina));
    const paginaAtual = Math.min(filtros.pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * filtros.tamanhoPagina;
    const resultados = ordenadas.slice(inicio, inicio + filtros.tamanhoPagina);

    return {
      pagina: paginaAtual,
      tamanhoPagina: filtros.tamanhoPagina,
      totalRegistros,
      totalPaginas,
      resultados,
      keywordsComErro,
    };
  }

  return { buscarLicitacoes };
})();
