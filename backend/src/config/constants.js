// Lista das 27 UFs brasileiras, usada para validar o filtro de Estado.
const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Palavras-chave pré-selecionadas exibidas como checkbox no frontend.
// Mantida também no backend para validar que o cliente não envie termos arbitrários demais.
const PALAVRAS_CHAVE_PADRAO = [
  'Mobiliário',
  'Móveis',
  'Móveis escolares',
  'Móveis de escritório',
  'Conjunto CJA',
  'Mesas',
  'Cadeiras',
];

module.exports = { UFS_VALIDAS, PALAVRAS_CHAVE_PADRAO };
