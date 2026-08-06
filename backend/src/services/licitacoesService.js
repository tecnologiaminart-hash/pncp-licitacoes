// Serviço de orquestração: é a peça que transforma N chamadas independentes à API do PNCP
// (uma por palavra-chave) em uma única lista de licitações, sem duplicatas, filtrada e paginada.
const { buscarPorPalavraChave } = require('./pncpClient');
const { normalizarLicitacao } = require('../utils/normalize');
const { cache, montarChaveCache } = require('../utils/cache');
const { contemTexto } = require('../utils/texto');
const { agoraNoBrasil, classificarSituacao } = require('../utils/situacao');
const { pncpMaxPaginasPorPalavra, pncpTamanhoPaginaUpstream } = require('../config/env');

/**
 * Busca todas as páginas (até o limite configurado) de uma palavra-chave no PNCP.
 * Para de buscar mais páginas assim que uma página vier com menos itens que o solicitado,
 * pois isso indica que não há mais resultados adiante.
 */
async function buscarTodasPaginasDaPalavra(palavraChave) {
  const licitacoes = [];
  for (let pagina = 1; pagina <= pncpMaxPaginasPorPalavra; pagina += 1) {
    // eslint-disable-next-line no-await-in-loop -- páginas de uma mesma palavra são sequenciais por natureza (paginação)
    const { items } = await buscarPorPalavraChave(palavraChave, pagina, pncpTamanhoPaginaUpstream);
    items.forEach((item) => licitacoes.push(normalizarLicitacao(item, palavraChave)));
    if (items.length < pncpTamanhoPaginaUpstream) break;
  }
  return licitacoes;
}

/**
 * Aplica os filtros de Estado (UF), modalidade, órgão e período sobre a lista já normalizada.
 * Esses filtros são aplicados aqui no backend (e não repassados à API do PNCP) porque
 * o endpoint de busca do PNCP não garante, de forma confiável, o filtro server-side
 * por UF/data/modalidade — então filtramos localmente sobre o conjunto de resultados obtido.
 */
function aplicarFiltros(licitacoes, { uf, modalidade, orgao, dataInicial, dataFinal }) {
  return licitacoes.filter((licitacao) => {
    if (uf && licitacao.uf !== uf) return false;
    if (modalidade && licitacao.modalidade !== modalidade) return false;
    if (orgao && !contemTexto(licitacao.orgao, orgao)) return false;

    if ((dataInicial || dataFinal) && licitacao.dataPublicacao) {
      const dataPub = licitacao.dataPublicacao.slice(0, 10); // "AAAA-MM-DD"
      if (dataInicial && dataPub < dataInicial) return false;
      if (dataFinal && dataPub > dataFinal) return false;
    }

    return true;
  });
}

/**
 * Ordena a lista já filtrada de acordo com a opção escolhida pelo usuário.
 * Aplicada em memória, fora do cache, para não precisar de uma entrada de
 * cache por combinação de ordenação (o custo de ordenar é desprezível).
 */
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
 * as que não se encaixam. Feito fora do cache (junto da ordenação) porque a situação
 * depende do instante em que a busca é feita, não apenas dos dados do PNCP.
 */
function classificarEFiltrarPorSituacao(licitacoes, situacoesSelecionadas) {
  const agoraStr = agoraNoBrasil();
  const comSituacao = licitacoes.map((licitacao) => ({
    ...licitacao,
    situacao: classificarSituacao(licitacao.dataFimVigencia, agoraStr),
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
  const chaveCache = montarChaveCache(filtros);
  const emCache = cache.get(chaveCache);
  if (emCache) return emCache;

  const resultadosPorPalavra = await Promise.allSettled(
    filtros.palavrasChave.map((palavra) => buscarTodasPaginasDaPalavra(palavra)),
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
    const erro = new Error('Não foi possível consultar o PNCP no momento. Tente novamente em instantes.');
    erro.status = 502;
    throw erro;
  }

  const unicas = removerDuplicadas(licitacoes);
  const filtradas = aplicarFiltros(unicas, filtros);

  const conjunto = { licitacoes: filtradas, keywordsComErro };
  cache.set(chaveCache, conjunto);
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

module.exports = { buscarLicitacoes };
