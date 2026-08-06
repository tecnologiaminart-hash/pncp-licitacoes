// Lista das 27 UFs brasileiras, usada para validar o filtro de Estado.
const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Palavras-chave pré-selecionadas exibidas como checkbox no frontend.
// O usuário pode remover qualquer uma delas e adicionar termos próprios — por isso
// o backend não restringe mais a busca a esta lista, ela serve apenas de sugestão inicial.
const PALAVRAS_CHAVE_PADRAO = [
  'Mobiliário',
  'Móveis',
  'Móveis escolares',
  'Móveis de escritório',
  'Conjunto CJA',
  'Mesas',
  'Cadeiras',
];

// Modalidades de contratação (tabela de domínio do PNCP), usadas no filtro de Modalidade.
const MODALIDADES_CONTRATACAO = [
  'Leilão - Eletrônico',
  'Leilão - Presencial',
  'Diálogo Competitivo',
  'Concurso',
  'Concorrência - Eletrônica',
  'Concorrência - Presencial',
  'Pregão - Eletrônico',
  'Pregão - Presencial',
  'Dispensa',
  'Inexigibilidade',
  'Manifestação de Interesse',
  'Pré-qualificação',
  'Credenciamento',
];

// Opções de ordenação aceitas pelo endpoint de busca.
const OPCOES_ORDENACAO = [
  'data_desc',
  'data_asc',
  'titulo_asc',
  'titulo_desc',
  'orgao_asc',
  'orgao_desc',
];

module.exports = {
  UFS_VALIDAS,
  PALAVRAS_CHAVE_PADRAO,
  MODALIDADES_CONTRATACAO,
  OPCOES_ORDENACAO,
};
