// Formulário "Editar contrato", usado dentro do Modal genérico (js/modal.js) pela aba
// Contratos ganhos.
const PipelineFormularios = (() => {
  function criarCampo(rotulo, tipo, id, opcoes = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'campo';

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = rotulo;

    const input = document.createElement('input');
    input.type = tipo;
    input.id = id;
    if (opcoes.required) input.required = true;
    if (opcoes.step) input.step = opcoes.step;
    if (opcoes.min !== undefined) input.min = opcoes.min;
    if (opcoes.valor !== undefined && opcoes.valor !== null) input.value = opcoes.valor;

    wrapper.append(label, input);
    return { wrapper, input };
  }

  function criarRodapeForm(form, erro, btnSalvar) {
    const acoes = document.createElement('div');
    acoes.className = 'form-modal__acoes';

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.className = 'botao botao--texto';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.addEventListener('click', () => Modal.fechar());

    acoes.append(btnCancelar, btnSalvar);
    form.append(erro, acoes);
  }

  function criarBotaoSalvar() {
    const botao = document.createElement('button');
    botao.type = 'submit';
    botao.className = 'botao botao--primario';
    botao.textContent = 'Salvar';
    return botao;
  }

  function criarMensagemErro() {
    const erro = document.createElement('span');
    erro.className = 'mensagem-validacao';
    erro.setAttribute('role', 'alert');
    return erro;
  }

  /**
   * Abre o modal com o formulário "🏆 Dados do contrato".
   * @param {object} linha Linha atual do Supabase (para preencher valores já salvos)
   * @param {(dados: object) => Promise<void>} aoConfirmar
   */
  function abrirFormularioContrato(linha, aoConfirmar) {
    const form = document.createElement('form');
    form.className = 'form-modal';

    const titulo = document.createElement('h2');
    titulo.className = 'form-modal__titulo';
    titulo.textContent = '🏆 Dados do contrato';

    const { wrapper: wValor, input: iValor } = criarCampo('Valor do contrato (R$)', 'number', 'formContratoValor', {
      step: '0.01', min: '0', valor: linha.contrato_valor,
    });
    const { wrapper: wInicio, input: iInicio } = criarCampo('Início da vigência', 'date', 'formContratoInicio', {
      valor: linha.contrato_vigencia_inicio,
    });
    const { wrapper: wFim, input: iFim } = criarCampo('Fim da vigência', 'date', 'formContratoFim', {
      valor: linha.contrato_vigencia_fim,
    });
    const { wrapper: wNumero, input: iNumero } = criarCampo('Número do contrato', 'text', 'formContratoNumero', {
      valor: linha.contrato_numero,
    });
    const { wrapper: wEmpenho, input: iEmpenho } = criarCampo('Número do empenho', 'text', 'formContratoEmpenho', {
      valor: linha.contrato_empenho,
    });
    const { wrapper: wOrdem, input: iOrdem } = criarCampo('Ordem de fornecimento', 'text', 'formContratoOrdem', {
      valor: linha.contrato_ordem_fornecimento,
    });

    const erro = criarMensagemErro();
    const btnSalvar = criarBotaoSalvar();
    form.append(titulo, wValor, wInicio, wFim, wNumero, wEmpenho, wOrdem);
    criarRodapeForm(form, erro, btnSalvar);

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      erro.textContent = '';
      btnSalvar.disabled = true;
      try {
        await aoConfirmar({
          valor: iValor.value ? Number(iValor.value) : null,
          vigenciaInicio: iInicio.value || null,
          vigenciaFim: iFim.value || null,
          numero: iNumero.value || null,
          empenho: iEmpenho.value || null,
          ordemFornecimento: iOrdem.value || null,
        });
        Modal.fechar();
      } catch (erroSalvar) {
        erro.textContent = erroSalvar.message;
        btnSalvar.disabled = false;
      }
    });

    Modal.abrir(form);
    iValor.focus();
  }

  return { abrirFormularioContrato };
})();
