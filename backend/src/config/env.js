// Centraliza a leitura das variáveis de ambiente (.env) em um único lugar,
// já com valores padrão sensatos caso alguma variável não esteja definida.
require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  pncpSearchUrl: process.env.PNCP_SEARCH_URL || 'https://pncp.gov.br/api/search/',
  pncpAppUrl: process.env.PNCP_APP_URL || 'https://pncp.gov.br/app',
  pncpTimeoutMs: Number(process.env.PNCP_TIMEOUT_MS) || 15000,
  pncpMaxPaginasPorPalavra: Number(process.env.PNCP_MAX_PAGES_POR_PALAVRA) || 3,
  pncpTamanhoPaginaUpstream: Number(process.env.PNCP_TAMANHO_PAGINA_UPSTREAM) || 50,
  cacheTtlSegundos: Number(process.env.CACHE_TTL_SEGUNDOS) || 300,
};
