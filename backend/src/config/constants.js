// Lista das 27 UFs brasileiras, usada para validar o filtro de Estado.
const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Palavras-chave pré-selecionadas exibidas como checkbox no frontend.
// Mantida também no backend para validar que o cliente não envie termos arbitrários demais.
const PALAVRAS_CHAVE_PADRAO = [
  'merenda escolar',
  'medicamentos',
  'material de limpeza',
  'construção civil',
  'informática',
  'combustível',
  'equipamentos hospitalares',
  'manutenção de veículos',
  'segurança e vigilância',
  'obras públicas',
];

module.exports = { UFS_VALIDAS, PALAVRAS_CHAVE_PADRAO };
