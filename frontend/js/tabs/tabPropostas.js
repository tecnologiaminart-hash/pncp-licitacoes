// Aba 3 — Propostas enviadas: histórico permanente de tudo em que a empresa participou.
// Mudar a situação aqui nunca arquiva ou remove o item da lista.
const TabPropostas = (() => {
  const elLista = document.getElementById('listaPropostas');
  const elSemResultados = document.getElementById('semPropostas');

  function preencherExtra(elCard, linha) {
    const extra = elCard.querySelector('.licitacao-card__extra');

    const campo = document.createElement('div');
    campo.className = 'campo campo--situacao-proposta';
    const label = document.createElement('label');
    label.setAttribute('for', `situacao-proposta-${linha.id}`);
    label.textContent = 'Situação da proposta';

    const select = document.createElement('select');
    select.id = `situacao-proposta-${linha.id}`;
    OPCOES_SITUACAO_PROPOSTA.forEach(({ value, label: rotulo }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = rotulo;
      option.selected = value === linha.situacao_proposta;
      select.appendChild(option);
    });

    select.addEventListener('change', async () => {
      const valorAnterior = linha.situacao_proposta;
      select.disabled = true;
      try {
        await PipelineRepository.atualizarSituacaoProposta(linha, select.value);
        linha.situacao_proposta = select.value;
      } catch (erro) {
        Toast.mostrarErro(erro.message);
        select.value = valorAnterior; // reverte a seleção visual em caso de falha
      } finally {
        select.disabled = false;
      }
    });

    campo.append(label, select);
    extra.append(campo);
  }

  async function renderizar() {
    elLista.innerHTML = '';
    elSemResultados.hidden = true;
    try {
      const linhas = await PipelineRepository.listarPorStatus('proposta_enviada');
      elSemResultados.hidden = linhas.length > 0;
      linhas.forEach((linha) => {
        const card = CardLicitacao.criar(linha.snapshot, [CardLicitacao.acaoAbrir()]);
        preencherExtra(card, linha);
        elLista.appendChild(card);
      });
    } catch (erro) {
      Toast.mostrarErro(`Não foi possível carregar "Propostas enviadas": ${erro.message}`);
    }
  }

  return { renderizar };
})();
