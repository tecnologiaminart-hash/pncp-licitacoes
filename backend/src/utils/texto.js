// Pequeno utilitário de comparação de texto tolerante a acentuação,
// usado no filtro de órgão (ex.: buscar "saude" deve encontrar "SAÚDE").
const REGEX_DIACRITICOS = /[̀-ͯ]/g;

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(REGEX_DIACRITICOS, '') // remove os diacríticos (acentos, til, cedilha etc.)
    .toLowerCase();
}

function contemTexto(textoCompleto, termoBusca) {
  return normalizarTexto(textoCompleto).includes(normalizarTexto(termoBusca));
}

module.exports = { normalizarTexto, contemTexto };
