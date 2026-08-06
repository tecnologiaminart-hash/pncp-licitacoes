// Cliente HTTP responsável exclusivamente por conversar com a API de busca do PNCP.
// Chamado direto do navegador — o PNCP libera CORS (Access-Control-Allow-Origin: *) para
// esse endpoint, o mesmo usado pelo próprio portal em pncp.gov.br/app/editais. Não há
// necessidade (nem possibilidade) de simular um User-Agent aqui: o fetch do navegador já
// envia um User-Agent genuíno, que é exatamente o que o WAF do PNCP espera ver.
const PncpClient = (() => {
  const SEARCH_URL = 'https://pncp.gov.br/api/search/';
  const TIMEOUT_MS = 15000;

  async function requisitar(params) {
    const controlador = new AbortController();
    const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    try {
      const resposta = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: controlador.signal,
        headers: { Accept: 'application/json' },
      });
      if (!resposta.ok) {
        throw new Error(`PNCP respondeu com status ${resposta.status}`);
      }
      return await resposta.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Busca uma página de licitações (editais) no PNCP para uma palavra-chave específica.
   * Faz uma tentativa extra em caso de falha de rede/timeout, já que a API pública
   * do PNCP costuma apresentar instabilidade e lentidão ocasionais.
   *
   * @param {string} palavraChave
   * @param {number} pagina Página solicitada à API do PNCP (1-based).
   * @param {number} tamanhoPagina Itens por página.
   * @returns {Promise<{items: object[], total: number}>}
   */
  async function buscarPorPalavraChave(palavraChave, pagina, tamanhoPagina) {
    const params = new URLSearchParams({
      q: palavraChave,
      tipos_documento: 'edital',
      ordenacao: '-data',
      pagina: String(pagina),
      tam_pagina: String(tamanhoPagina),
    });

    try {
      const data = await requisitar(params);
      return { items: data.items || [], total: data.total || 0 };
    } catch (erroOriginal) {
      try {
        const data = await requisitar(params); // uma retentativa simples
        return { items: data.items || [], total: data.total || 0 };
      } catch (erro) {
        const erroFinal = new Error(`Falha ao consultar o PNCP para a palavra-chave "${palavraChave}": ${erro.message}`);
        erroFinal.palavraChave = palavraChave;
        erroFinal.causa = erro;
        throw erroFinal;
      }
    }
  }

  return { buscarPorPalavraChave };
})();
