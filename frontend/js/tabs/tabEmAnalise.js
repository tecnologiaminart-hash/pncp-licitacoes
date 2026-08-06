// Aba 2 — Em análise: licitações salvas para decidir depois, ainda sem proposta enviada.
const TabEmAnalise = (() => {
  const elLista = document.getElementById('listaEmAnalise');
  const elSemResultados = document.getElementById('semEmAnalise');

  function removerCard(elCard) {
    elCard.remove();
    if (elLista.children.length === 0) elSemResultados.hidden = false;
  }

  function criarAcoes(licitacao) {
    return [
      CardLicitacao.acaoAbrir(),
      {
        icone: '📄',
        rotulo: 'Enviado proposta',
        variante: 'proposta',
        aoClicar: async (lic, elCard, botao) => {
          botao.disabled = true;
          try {
            await PipelineRepository.marcarPropostaEnviada(lic);
            removerCard(elCard);
          } catch (erro) {
            Toast.mostrarErro(erro.message);
            botao.disabled = false;
          }
        },
      },
      {
        icone: '❌',
        rotulo: 'Marcar como não atende',
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
    ];
  }

  async function renderizar() {
    elLista.innerHTML = '';
    elSemResultados.hidden = true;
    try {
      const linhas = await PipelineRepository.listarPorStatus('em_analise');
      elSemResultados.hidden = linhas.length > 0;
      linhas.forEach((linha) => {
        elLista.appendChild(CardLicitacao.criar(linha.snapshot, criarAcoes(linha.snapshot)));
      });
    } catch (erro) {
      Toast.mostrarErro(`Não foi possível carregar "Em análise": ${erro.message}`);
    }
  }

  return { renderizar };
})();
