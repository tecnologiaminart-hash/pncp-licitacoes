// Configuração estática do frontend: UFs disponíveis e palavras-chave pré-selecionadas.
// Mantida em espelho com backend/src/config/constants.js — qualquer alteração de uma
// lista deve ser refletida na outra, já que o backend valida as palavras-chave recebidas.

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Todas iniciam marcadas; o usuário pode desmarcar qualquer uma antes de pesquisar.
const PALAVRAS_CHAVE_PADRAO = [
  'Mobiliário',
  'Móveis',
  'Móveis escolares',
  'Móveis de escritório',
  'Conjunto CJA',
  'Mesas',
  'Cadeiras',
];
