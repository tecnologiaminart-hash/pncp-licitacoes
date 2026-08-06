// Cliente HTTP responsável exclusivamente por conversar com a API do PNCP.
// Nenhuma regra de negócio (merge, dedupe, filtro) deve viver aqui — só a chamada HTTP crua.
const axios = require('axios');
const { pncpSearchUrl, pncpTimeoutMs } = require('../config/env');

// O PNCP fica atrás de um WAF que rejeita (connection reset) requisições com o
// User-Agent padrão de clientes HTTP (ex.: "axios/1.x"). Por isso simulamos um
// User-Agent de navegador, assim como o próprio portal pncp.gov.br faz ao chamar esse endpoint.
const http = axios.create({
  baseURL: pncpSearchUrl,
  timeout: pncpTimeoutMs,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
});

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
  const params = {
    q: palavraChave,
    tipos_documento: 'edital',
    ordenacao: '-data',
    pagina,
    tam_pagina: tamanhoPagina,
  };

  try {
    const { data } = await http.get('', { params });
    return { items: data.items || [], total: data.total || 0 };
  } catch (erroOriginal) {
    try {
      const { data } = await http.get('', { params }); // uma retentativa simples
      return { items: data.items || [], total: data.total || 0 };
    } catch (erro) {
      const mensagem = erro.response
        ? `PNCP respondeu com status ${erro.response.status} para a palavra-chave "${palavraChave}".`
        : `Falha de comunicação com o PNCP para a palavra-chave "${palavraChave}": ${erro.message}`;
      const erroFinal = new Error(mensagem);
      erroFinal.palavraChave = palavraChave;
      erroFinal.causa = erro;
      throw erroFinal;
    }
  }
}

module.exports = { buscarPorPalavraChave };
