// Aba 1 — Buscar Licitações: painel de filtros + busca direto na API do PNCP.
// Só mostra licitações que ainda não têm classificação nenhuma no pipeline (Supabase).
const TabBuscar = (() => {
  const elDataInicial = document.getElementById('dataInicial');
  const elDataFinal = document.getElementById('dataFinal');
  const elBtnPesquisar = document.getElementById('btnPesquisar');

  const TAMANHO_PAGINA = 12;
  let jaInicializado = false;
  let resumoAtual = null; // { totalRegistros, pagina, totalPaginas } da última busca, mantido em dia conforme cards somem

  function montarFiltros(pagina) {
    return {
      uf: Ui.elUf.value,
      modalidade: Ui.elModalidade.value,
      ordenacao: Ui.elOrdenacao.value,
      situacoes: Ui.obterSituacoesSelecionadas(),
      dataInicial: elDataInicial.value,
      dataFinal: elDataFinal.value,
      palavrasChave: Ui.obterPalavrasChaveSelecionadas(),
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    };
  }

  function validarFiltrosLocalmente(filtros) {
    if (filtros.palavrasChave.length === 0) {
      return 'Selecione ou adicione ao menos uma palavra-chave para pesquisar.';
    }
    if (filtros.dataInicial && filtros.dataFinal && filtros.dataInicial > filtros.dataFinal) {
      return 'A data inicial não pode ser posterior à data final.';
    }
    return '';
  }

  /**
   * Remove o card da tela após uma ação bem-sucedida (⭐/❌/📄) e ajusta o contador de
   * resultados — sem isso, o texto "X licitação(ões) encontrada(s)" ficava parado no
   * número da busca original mesmo com cards sumindo da tela.
   */
  function removerCard(elCard) {
    elCard.remove();
    if (Ui.elResultados.children.length === 0) {
      Ui.elSemResultados.hidden = false;
    }
    if (resumoAtual) {
      resumoAtual.totalRegistros = Math.max(0, resumoAtual.totalRegistros - 1);
      Ui.renderizarResumo(resumoAtual);
    }
  }

  function criarAcoes(licitacao) {
    return [
      CardLicitacao.acaoAbrir(),
      {
        icone: '⭐',
        rotulo: 'Salvar para analisar depois',
        variante: 'salvar',
        aoClicar: async (lic, elCard, botao) => {
          botao.disabled = true;
          try {
            await PipelineRepository.salvarParaAnalisar(lic);
            removerCard(elCard);
          } catch (erro) {
            Toast.mostrarErro(erro.message);
            botao.disabled = false;
          }
        },
      },
      {
        icone: '❌',
        rotulo: 'Não atende',
        variante: 'descartar',
        aoClicar: async (lic, elCard, botao) => {
          botao.disabled = true;
          try {
            await PipelineRepository.marcarNaoAtende(lic);
            removerCard(elCard);
          } catch (erro) {
            Toast.mostrarErro(erro.message);
            botao.disabled = false;
          }
        },
      },
      {
        icone: '📄',
        rotulo: 'Enviado proposta',
        variante: 'proposta',
        aoClicar: (lic, elCard) => {
          PipelineFormularios.abrirFormularioProposta(async (dados) => {
            await PipelineRepository.marcarPropostaEnviada(lic, dados);
            removerCard(elCard);
          });
        },
      },
    ];
  }

  /**
   * Renderiza os resultados da busca, excluindo os que já têm classificação no pipeline.
   * Se a checagem no Supabase falhar, mostra um aviso mas segue exibindo tudo (fail-open) —
   * não faz sentido travar a busca inteira por causa de uma verificação auxiliar.
   */
  async function renderizarResultados(resultados) {
    Ui.elResultados.innerHTML = '';

    let idsClassificados = new Set();
    try {
      idsClassificados = await PipelineRepository.listarIdsClassificados(resultados.map((lic) => lic.id));
    } catch (erro) {
      Ui.mostrarAviso(
        `Não foi possível verificar licitações já classificadas (${erro.message}). `
        + 'Os resultados abaixo podem incluir itens já classificados em outras abas.',
      );
    }

    const visiveis = resultados.filter((licitacao) => !idsClassificados.has(licitacao.id));
    Ui.elSemResultados.hidden = visiveis.length > 0;
    visiveis.forEach((licitacao) => {
      Ui.elResultados.appendChild(CardLicitacao.criar(licitacao, criarAcoes(licitacao)));
    });
  }

  async function executarBusca(pagina = 1) {
    const filtros = montarFiltros(pagina);
    const mensagemErro = validarFiltrosLocalmente(filtros);
    Ui.mostrarMensagemValidacao(mensagemErro);
    if (mensagemErro) return;

    Ui.limparResultadosAntesDaBusca();
    Ui.alternarLoading(true);

    try {
      const resposta = await PncpLicitacoesService.buscarLicitacoes(filtros);
      await renderizarResultados(resposta.resultados);
      resumoAtual = { totalRegistros: resposta.totalRegistros, pagina: resposta.pagina, totalPaginas: resposta.totalPaginas };
      Ui.renderizarResumo(resumoAtual);
      Ui.renderizarPaginacao(resposta, executarBusca);
      if (resposta.keywordsComErro.length > 0) Ui.mostrarAvisoParcial(resposta.keywordsComErro);
    } catch (erro) {
      Ui.mostrarErro(erro.message);
    } finally {
      Ui.alternarLoading(false);
    }
  }

  function adicionarNovaPalavraChaveDoInput() {
    const valor = Ui.elNovaPalavraChave.value;
    if (!valor.trim()) return;

    const adicionou = Ui.adicionarPalavraChave(valor);
    Ui.mostrarMensagemValidacao(adicionou ? '' : 'Essa palavra-chave já está na lista.');
    Ui.elNovaPalavraChave.value = '';
    Ui.elNovaPalavraChave.focus();
  }

  function inicializarControles() {
    Ui.preencherUfs();
    Ui.preencherModalidades();
    Ui.preencherOrdenacao();
    Ui.preencherSituacoes();
    Ui.preencherPalavrasChave();

    elBtnPesquisar.addEventListener('click', () => executarBusca(1));

    Ui.elBtnAdicionarPalavraChave.addEventListener('click', adicionarNovaPalavraChaveDoInput);
    Ui.elNovaPalavraChave.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        adicionarNovaPalavraChaveDoInput();
      }
    });
  }

  /** Chamado pelo shell.js sempre que a aba é ativada. Só busca automaticamente na primeira vez. */
  function renderizar() {
    if (jaInicializado) return;
    jaInicializado = true;
    inicializarControles();
    executarBusca(1);
  }

  return { renderizar };
})();
