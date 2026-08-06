// Aba 5 — Arquivadas: itens descartados (❌ Não atende, e futuramente outros motivos).
// "Restaurar" muda o status para 'restaurada' (não apaga a linha — preserva o histórico de
// motivo/data). Isso faz o item voltar a contar como "não classificado" e reaparecer na
// aba Buscar assim que uma busca futura o encontrar de novo.
const TabArquivadas = (() => {
  const elLista = document.getElementById('listaArquivadas');
  const elSemResultados = document.getElementById('semArquivadas');

  function removerCard(elCard) {
    elCard.remove();
    if (elLista.children.length === 0) elSemResultados.hidden = false;
  }

  function preencherExtra(elCard, linha) {
    const extra = elCard.querySelector('.licitacao-card__extra');
    const motivo = MOTIVOS_ARQUIVAMENTO[linha.motivo_arquivamento] || linha.motivo_arquivamento || 'Não informado';
    const p = document.createElement('p');
    p.className = 'contrato-info';
    p.textContent = `Motivo do arquivamento: ${motivo}`;
    extra.appendChild(p);
  }

  function criarAcoes(linha) {
    return [
      CardLicitacao.acaoAbrir(),
      {
        icone: '↩️',
        rotulo: 'Restaurar',
        variante: 'salvar',
        aoClicar: async (licitacao, elCard, botao) => {
          botao.disabled = true;
          try {
            await PipelineRepository.restaurar(linha);
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
      const linhas = await PipelineRepository.listarPorStatus('arquivada');
      elSemResultados.hidden = linhas.length > 0;
      linhas.forEach((linha) => {
        const card = CardLicitacao.criar(linha.snapshot, criarAcoes(linha));
        preencherExtra(card, linha);
        elLista.appendChild(card);
      });
    } catch (erro) {
      Toast.mostrarErro(`Não foi possível carregar "Arquivadas": ${erro.message}`);
    }
  }

  return { renderizar };
})();
