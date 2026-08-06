// Ponto de entrada do frontend: liga os eventos da página à camada de API e de UI.
(() => {
  const elDataInicial = document.getElementById('dataInicial');
  const elDataFinal = document.getElementById('dataFinal');
  const elBtnPesquisar = document.getElementById('btnPesquisar');

  let paginaAtual = 1;
  const TAMANHO_PAGINA = 12;

  function montarFiltros(pagina) {
    return {
      uf: Ui.elUf.value,
      dataInicial: elDataInicial.value,
      dataFinal: elDataFinal.value,
      palavrasChave: Ui.obterPalavrasChaveSelecionadas(),
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    };
  }

  function validarFiltrosLocalmente(filtros) {
    if (filtros.palavrasChave.length === 0) {
      return 'Selecione ao menos uma palavra-chave para pesquisar.';
    }
    if (filtros.dataInicial && filtros.dataFinal && filtros.dataInicial > filtros.dataFinal) {
      return 'A data inicial não pode ser posterior à data final.';
    }
    return '';
  }

  async function executarBusca(pagina = 1) {
    const filtros = montarFiltros(pagina);
    const mensagemErro = validarFiltrosLocalmente(filtros);
    Ui.mostrarMensagemValidacao(mensagemErro);
    if (mensagemErro) return;

    paginaAtual = pagina;
    Ui.limparResultadosAntesDaBusca();
    Ui.alternarLoading(true);

    try {
      const resposta = await ApiLicitacoes.buscar(filtros);
      Ui.renderizarResultados(resposta.resultados);
      Ui.renderizarResumo(resposta);
      Ui.renderizarPaginacao(resposta, executarBusca);
      Ui.mostrarAvisoParcial(resposta.keywordsComErro);
    } catch (erro) {
      Ui.mostrarErro(erro.message);
    } finally {
      Ui.alternarLoading(false);
    }
  }

  function inicializar() {
    Ui.preencherUfs();
    Ui.preencherPalavrasChave();
    elBtnPesquisar.addEventListener('click', () => executarBusca(1));
  }

  document.addEventListener('DOMContentLoaded', inicializar);
})();
