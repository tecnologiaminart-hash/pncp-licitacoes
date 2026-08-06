// Aba 4 — Contratos ganhos: não é um status próprio, é o filtro de propostas com
// situacao_proposta = 'venceu'. A ação "Editar contrato" preenche os campos que não têm
// lugar em nenhuma outra aba (valor, vigência, número do contrato, empenho, ordem de
// fornecimento) — essa ação foi uma adição para viabilizar esses campos, não estava
// explícita no pedido original.
const TabContratos = (() => {
  const elLista = document.getElementById('listaContratos');
  const elSemResultados = document.getElementById('semContratos');

  function linhaDadoOuNaoInformado(rotulo, valor) {
    const p = document.createElement('p');
    p.className = 'contrato-info';
    p.textContent = `${rotulo}: ${valor || 'Não informado'}`;
    return p;
  }

  function preencherExtra(elCard, linha) {
    const extra = elCard.querySelector('.licitacao-card__extra');
    extra.innerHTML = '';

    extra.appendChild(linhaDadoOuNaoInformado('Valor do contrato', CardLicitacao.formatarMoeda(linha.contrato_valor)));
    const vigencia = (linha.contrato_vigencia_inicio || linha.contrato_vigencia_fim)
      ? `${CardLicitacao.formatarData(linha.contrato_vigencia_inicio)} até ${CardLicitacao.formatarData(linha.contrato_vigencia_fim)}`
      : null;
    extra.appendChild(linhaDadoOuNaoInformado('Vigência', vigencia));
    extra.appendChild(linhaDadoOuNaoInformado('Número do contrato', linha.contrato_numero));
    extra.appendChild(linhaDadoOuNaoInformado('Empenho', linha.contrato_empenho));
    extra.appendChild(linhaDadoOuNaoInformado('Ordem de fornecimento', linha.contrato_ordem_fornecimento));
  }

  function criarAcoes(linha) {
    return [
      CardLicitacao.acaoAbrir(),
      {
        icone: '✏️',
        rotulo: 'Editar contrato',
        variante: 'proposta',
        aoClicar: (licitacao, elCard) => {
          PipelineFormularios.abrirFormularioContrato(linha, async (dados) => {
            const atualizada = await PipelineRepository.atualizarContrato(linha, dados);
            Object.assign(linha, atualizada);
            preencherExtra(elCard, linha);
          });
        },
      },
    ];
  }

  async function renderizar() {
    elLista.innerHTML = '';
    elSemResultados.hidden = true;
    try {
      const linhas = await PipelineRepository.listarContratosGanhos();
      elSemResultados.hidden = linhas.length > 0;
      linhas.forEach((linha) => {
        const card = CardLicitacao.criar(linha.snapshot, criarAcoes(linha));
        preencherExtra(card, linha);
        elLista.appendChild(card);
      });
    } catch (erro) {
      Toast.mostrarErro(`Não foi possível carregar "Contratos ganhos": ${erro.message}`);
    }
  }

  return { renderizar };
})();
