// Componente de card único, reutilizado pelas 5 abas. Recebe uma licitação normalizada
// (vinda direto do PNCP ou reidratada a partir de um snapshot salvo no Supabase — ambas têm
// o mesmo formato) e uma lista de ações contextuais à aba atual.
//
// Os textos vindos de fora (PNCP ou Supabase) são sempre atribuídos via textContent, nunca
// innerHTML, evitando XSS.
const CardLicitacao = (() => {
  const formatadorData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function formatarData(isoString) {
    if (!isoString) return 'Data não informada';
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) return 'Data não informada';
    return formatadorData.format(data);
  }

  function formatarDataHora(isoString) {
    if (!isoString) return 'Não informado';
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) return 'Não informado';
    return formatadorDataHora.format(data);
  }

  function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '') return 'Não informado';
    const numero = Number(valor);
    if (Number.isNaN(numero)) return 'Não informado';
    return formatadorMoeda.format(numero);
  }

  function criarChip(texto, classeExtra) {
    const chip = document.createElement('span');
    chip.className = `chip${classeExtra ? ` ${classeExtra}` : ''}`;
    chip.textContent = texto;
    return chip;
  }

  /**
   * @param {object} licitacao Objeto normalizado: id, titulo, orgao, uf, municipio,
   *   dataPublicacao, dataInicioVigencia, dataFimVigencia, modalidade, objetoResumido,
   *   palavraChave, linkPncp. Pode vir direto do PNCP (aba Buscar) ou de um snapshot salvo
   *   no Supabase (abas 2-5) — o formato é o mesmo nos dois casos.
   * @param {{icone: string, rotulo: string, aoClicar: (licitacao: object, elementoCard: HTMLElement) => void, variante?: string}[]} acoes
   * @returns {HTMLElement} artigo .licitacao-card já populado. Tem um `.licitacao-card__extra`
   *   vazio que cada aba pode preencher com conteúdo próprio (ex.: dropdown de situação da
   *   proposta) via querySelector antes de inserir o card na página.
   */
  function criar(licitacao, acoes = []) {
    const artigo = document.createElement('article');
    artigo.className = 'licitacao-card';

    const header = document.createElement('header');
    header.className = 'licitacao-card__header';
    const titulo = document.createElement('h2');
    titulo.className = 'licitacao-card__titulo';
    titulo.textContent = licitacao.titulo;
    header.append(titulo, criarChip(licitacao.modalidade, 'chip--modalidade'));

    const orgaoP = document.createElement('p');
    orgaoP.className = 'licitacao-card__orgao';
    const orgaoRotulo = document.createElement('span');
    orgaoRotulo.className = 'licitacao-card__orgao-rotulo';
    orgaoRotulo.textContent = 'Órgão:';
    const orgaoValor = document.createElement('span');
    orgaoValor.className = 'licitacao-card__orgao-valor';
    orgaoValor.textContent = licitacao.orgao;
    orgaoP.append(orgaoRotulo, orgaoValor);

    const localP = document.createElement('p');
    localP.className = 'licitacao-card__local';
    localP.textContent = `${licitacao.municipio || 'Município não informado'} — ${licitacao.uf || 'UF não informada'}`;

    const objetoP = document.createElement('p');
    objetoP.className = 'licitacao-card__objeto';
    objetoP.textContent = licitacao.objetoResumido;

    const footer = document.createElement('footer');
    footer.className = 'licitacao-card__footer';

    const agoraStr = PncpSituacao.agoraNoBrasil();
    const situacao = licitacao.situacao || PncpSituacao.classificarSituacao(licitacao.dataFimVigencia, agoraStr);
    const infoSituacao = SITUACAO_INFO[situacao];
    footer.appendChild(criarChip(
      infoSituacao ? infoSituacao.label : 'Situação não informada',
      `chip--situacao${infoSituacao ? ` ${infoSituacao.classe}` : ''}`,
    ));
    footer.appendChild(criarChip(`Publicação: ${formatarData(licitacao.dataPublicacao)}`, 'chip--data'));
    footer.appendChild(criarChip(`Início: ${formatarDataHora(licitacao.dataInicioVigencia)}`, 'chip--data-inicio'));
    footer.appendChild(criarChip(`Fim: ${formatarDataHora(licitacao.dataFimVigencia)}`, 'chip--data-fim'));
    if (licitacao.palavraChave) {
      footer.appendChild(criarChip(`#${licitacao.palavraChave}`, 'chip--palavra'));
    }

    const extra = document.createElement('div');
    extra.className = 'licitacao-card__extra';

    const acoesDiv = document.createElement('div');
    acoesDiv.className = 'licitacao-card__acoes';
    acoes.forEach((acao) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = `botao botao--acao${acao.variante ? ` botao--acao--${acao.variante}` : ''}`;

      const iconeSpan = document.createElement('span');
      iconeSpan.setAttribute('aria-hidden', 'true');
      iconeSpan.textContent = acao.icone;
      const rotuloSpan = document.createElement('span');
      rotuloSpan.textContent = acao.rotulo;
      botao.append(iconeSpan, rotuloSpan);

      botao.addEventListener('click', (evento) => {
        evento.stopPropagation();
        acao.aoClicar(licitacao, artigo, botao);
      });
      acoesDiv.appendChild(botao);
    });

    artigo.append(header, orgaoP, localP, objetoP, footer, extra, acoesDiv);
    return artigo;
  }

  function abrirLinkOficial(licitacao) {
    window.open(licitacao.linkPncp, '_blank', 'noopener,noreferrer');
  }

  /** Ação pronta "👁️ Abrir no PNCP", reutilizada por várias abas. */
  function acaoAbrir() {
    return { icone: '👁️', rotulo: 'Abrir no PNCP', aoClicar: abrirLinkOficial };
  }

  return { criar, abrirLinkOficial, acaoAbrir, formatarData, formatarDataHora, formatarMoeda };
})();
