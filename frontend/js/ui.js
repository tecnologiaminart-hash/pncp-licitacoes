// Camada de UI: toda manipulação direta do DOM fica isolada aqui.
// Os textos vindos da API são sempre atribuídos via textContent (nunca innerHTML),
// evitando XSS a partir de dados retornados pelo PNCP.

const Ui = (() => {
  const elUf = document.getElementById('uf');
  const elModalidade = document.getElementById('modalidade');
  const elOrgao = document.getElementById('orgao');
  const elOrdenacao = document.getElementById('ordenacao');
  const elListaSituacoes = document.getElementById('listaSituacoes');
  const elListaPalavras = document.getElementById('listaPalavrasChave');
  const elNovaPalavraChave = document.getElementById('novaPalavraChave');
  const elBtnAdicionarPalavraChave = document.getElementById('btnAdicionarPalavraChave');
  const elMensagemValidacao = document.getElementById('mensagemValidacao');
  const elBtnPesquisar = document.getElementById('btnPesquisar');
  const elLoading = document.getElementById('loading');
  const elErro = document.getElementById('erro');
  const elErroMensagem = document.getElementById('erroMensagem');
  const elAvisoParcial = document.getElementById('avisoParcial');
  const elAvisoParcialMensagem = document.getElementById('avisoParcialMensagem');
  const elResumo = document.getElementById('resumoResultados');
  const elResultados = document.getElementById('resultados');
  const elSemResultados = document.getElementById('semResultados');
  const elPaginacao = document.getElementById('paginacao');
  const templateCard = document.getElementById('templateCardLicitacao');

  const formatadorData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function preencherUfs() {
    UFS.forEach((uf) => {
      const option = document.createElement('option');
      option.value = uf;
      option.textContent = uf;
      elUf.appendChild(option);
    });
  }

  function preencherModalidades() {
    MODALIDADES_CONTRATACAO.forEach((modalidade) => {
      const option = document.createElement('option');
      option.value = modalidade;
      option.textContent = modalidade;
      elModalidade.appendChild(option);
    });
  }

  function preencherOrdenacao() {
    OPCOES_ORDENACAO.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      elOrdenacao.appendChild(option);
    });
  }

  function preencherSituacoes() {
    SITUACOES.forEach(({ value, padraoMarcada }) => {
      const label = document.createElement('label');
      label.className = 'checkbox-palavra';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.checked = padraoMarcada;

      const span = document.createElement('span');
      span.textContent = SITUACAO_INFO[value].label;

      label.append(input, span);
      elListaSituacoes.appendChild(label);
    });
  }

  function obterSituacoesSelecionadas() {
    return Array.from(elListaSituacoes.querySelectorAll('input:checked')).map((input) => input.value);
  }

  /** Verifica (sem diferenciar maiúsc./minúsc.) se a palavra já está na lista atual. */
  function existePalavraChave(palavra) {
    const alvo = palavra.trim().toLowerCase();
    return Array.from(elListaPalavras.children).some(
      (chip) => chip.dataset.valor.toLowerCase() === alvo,
    );
  }

  function criarChipPalavra(palavra) {
    const chip = document.createElement('label');
    chip.className = 'checkbox-palavra chip-palavra';
    chip.dataset.valor = palavra;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = palavra;
    input.checked = true; // toda palavra nova entra marcada; o usuário pode desmarcar

    const span = document.createElement('span');
    span.textContent = palavra;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'chip-palavra__remover';
    btnRemover.textContent = '×';
    btnRemover.setAttribute('aria-label', `Remover palavra-chave ${palavra}`);
    // Impede que o clique no "×" também acione o toggle do checkbox do <label> pai.
    btnRemover.addEventListener('click', (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
      chip.remove();
    });

    chip.append(input, span, btnRemover);
    return chip;
  }

  /** Adiciona uma nova palavra-chave à lista (ignora vazias e duplicadas). Retorna true se adicionou. */
  function adicionarPalavraChave(palavraBruta) {
    const palavra = palavraBruta.trim();
    if (!palavra || existePalavraChave(palavra)) return false;
    elListaPalavras.appendChild(criarChipPalavra(palavra));
    return true;
  }

  function preencherPalavrasChave() {
    PALAVRAS_CHAVE_PADRAO.forEach((palavra) => adicionarPalavraChave(palavra));
  }

  function obterPalavrasChaveSelecionadas() {
    return Array.from(elListaPalavras.querySelectorAll('input:checked')).map((input) => input.value);
  }

  function mostrarMensagemValidacao(mensagem) {
    elMensagemValidacao.textContent = mensagem || '';
  }

  function alternarLoading(mostrar) {
    elLoading.hidden = !mostrar;
    elBtnPesquisar.disabled = mostrar;
  }

  function mostrarErro(mensagem) {
    elErroMensagem.textContent = mensagem;
    elErro.hidden = false;
  }

  function esconderErro() {
    elErro.hidden = true;
  }

  function mostrarAvisoParcial(palavrasComErro) {
    if (!palavrasComErro || palavrasComErro.length === 0) {
      elAvisoParcial.hidden = true;
      return;
    }
    elAvisoParcialMensagem.textContent =
      `Não foi possível consultar o PNCP para: ${palavrasComErro.join(', ')}. Os demais resultados são exibidos normalmente.`;
    elAvisoParcial.hidden = false;
  }

  function formatarData(isoString) {
    if (!isoString) return 'Data não informada';
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) return 'Data não informada';
    return formatadorData.format(data);
  }

  function criarCard(licitacao) {
    const fragmento = templateCard.content.cloneNode(true);
    const artigo = fragmento.querySelector('.licitacao-card');

    fragmento.querySelector('.licitacao-card__titulo').textContent = licitacao.titulo;
    fragmento.querySelector('.chip--modalidade').textContent = licitacao.modalidade;
    fragmento.querySelector('.licitacao-card__orgao').textContent = licitacao.orgao;
    fragmento.querySelector('.licitacao-card__local').textContent =
      `${licitacao.municipio || 'Município não informado'} — ${licitacao.uf || 'UF não informada'}`;
    fragmento.querySelector('.licitacao-card__objeto').textContent = licitacao.objetoResumido;
    fragmento.querySelector('.chip--data').textContent = formatarData(licitacao.dataPublicacao);
    fragmento.querySelector('.chip--palavra').textContent = `#${licitacao.palavraChave}`;

    const infoSituacao = SITUACAO_INFO[licitacao.situacao];
    const chipSituacao = fragmento.querySelector('.chip--situacao');
    if (infoSituacao) {
      chipSituacao.textContent = infoSituacao.label;
      chipSituacao.classList.add(infoSituacao.classe);
    } else {
      chipSituacao.textContent = 'Situação não informada';
    }

    const abrirLink = () => window.open(licitacao.linkPncp, '_blank', 'noopener,noreferrer');
    artigo.addEventListener('click', abrirLink);
    artigo.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        abrirLink();
      }
    });
    artigo.setAttribute('aria-label', `Abrir no PNCP: ${licitacao.titulo}`);

    return fragmento;
  }

  function renderizarResultados(resultados) {
    elResultados.innerHTML = '';
    elSemResultados.hidden = resultados.length > 0;
    resultados.forEach((licitacao) => elResultados.appendChild(criarCard(licitacao)));
  }

  function renderizarResumo({ totalRegistros, pagina, totalPaginas }) {
    if (totalRegistros === 0) {
      elResumo.hidden = true;
      return;
    }
    elResumo.hidden = false;
    elResumo.textContent = `${totalRegistros} licitação(ões) encontrada(s) — página ${pagina} de ${totalPaginas}`;
  }

  function renderizarPaginacao(estado, aoTrocarPagina) {
    const { pagina, totalPaginas } = estado;
    elPaginacao.innerHTML = '';

    if (totalPaginas <= 1) {
      elPaginacao.hidden = true;
      return;
    }
    elPaginacao.hidden = false;

    const criarBotao = (rotulo, paginaAlvo, opcoes = {}) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'paginacao__pagina';
      if (opcoes.ativa) botao.classList.add('paginacao__pagina--ativa');
      botao.textContent = rotulo;
      botao.disabled = Boolean(opcoes.desabilitada);
      botao.addEventListener('click', () => aoTrocarPagina(paginaAlvo));
      return botao;
    };

    elPaginacao.appendChild(criarBotao('‹', pagina - 1, { desabilitada: pagina <= 1 }));

    const inicio = Math.max(1, pagina - 2);
    const fim = Math.min(totalPaginas, inicio + 4);
    for (let numero = inicio; numero <= fim; numero += 1) {
      elPaginacao.appendChild(criarBotao(String(numero), numero, { ativa: numero === pagina }));
    }

    elPaginacao.appendChild(criarBotao('›', pagina + 1, { desabilitada: pagina >= totalPaginas }));
  }

  function limparResultadosAntesDaBusca() {
    esconderErro();
    elAvisoParcial.hidden = true;
    elResumo.hidden = true;
    elSemResultados.hidden = true;
    elResultados.innerHTML = '';
    elPaginacao.hidden = true;
  }

  return {
    elUf,
    elModalidade,
    elOrgao,
    elOrdenacao,
    elNovaPalavraChave,
    elBtnAdicionarPalavraChave,
    preencherUfs,
    preencherModalidades,
    preencherOrdenacao,
    preencherSituacoes,
    obterSituacoesSelecionadas,
    preencherPalavrasChave,
    adicionarPalavraChave,
    obterPalavrasChaveSelecionadas,
    mostrarMensagemValidacao,
    alternarLoading,
    mostrarErro,
    esconderErro,
    mostrarAvisoParcial,
    renderizarResultados,
    renderizarResumo,
    renderizarPaginacao,
    limparResultadosAntesDaBusca,
  };
})();
