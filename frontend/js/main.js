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
      modalidade: Ui.elModalidade.value,
      orgao: Ui.elOrgao.value.trim(),
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

  /** Lê o campo de nova palavra-chave, adiciona à lista (se válida) e limpa o campo. */
  function adicionarNovaPalavraChaveDoInput() {
    const valor = Ui.elNovaPalavraChave.value;
    if (!valor.trim()) return;

    const adicionou = Ui.adicionarPalavraChave(valor);
    Ui.mostrarMensagemValidacao(adicionou ? '' : 'Essa palavra-chave já está na lista.');
    Ui.elNovaPalavraChave.value = '';
    Ui.elNovaPalavraChave.focus();
  }

  function inicializar() {
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

    executarBusca(1); // busca automaticamente com os filtros padrão assim que a página abre
  }

  document.addEventListener('DOMContentLoaded', inicializar);
})();
