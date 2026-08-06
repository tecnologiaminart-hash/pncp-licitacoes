// Configuração estática do frontend: UFs, modalidades, opções de ordenação e
// palavras-chave pré-selecionadas. Mantida em espelho com backend/src/config/constants.js.

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

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

// value = valor enviado à API; label = texto exibido no <select>.
const OPCOES_ORDENACAO = [
  { value: 'data_desc', label: 'Mais recentes primeiro' },
  { value: 'data_asc', label: 'Mais antigas primeiro' },
  { value: 'titulo_asc', label: 'Título (A-Z)' },
  { value: 'titulo_desc', label: 'Título (Z-A)' },
  { value: 'orgao_asc', label: 'Órgão (A-Z)' },
  { value: 'orgao_desc', label: 'Órgão (Z-A)' },
];

// Situações possíveis de uma licitação (calculadas pelo backend a partir da data de
// fim de recebimento de propostas). "aberta" e "encerra_hoje" já vêm marcadas por padrão.
const SITUACOES = [
  { value: 'aberta', padraoMarcada: true },
  { value: 'encerra_hoje', padraoMarcada: true },
  { value: 'encerrada', padraoMarcada: false },
];

// Rótulo em português e classe CSS do chip exibido em cada card, por situação.
const SITUACAO_INFO = {
  aberta: { label: 'Aberta para propostas', classe: 'chip--situacao-aberta' },
  encerra_hoje: { label: 'Encerra hoje', classe: 'chip--situacao-encerra-hoje' },
  encerrada: { label: 'Encerrada', classe: 'chip--situacao-encerrada' },
};

// Sugestões iniciais; o usuário pode remover qualquer uma e adicionar termos próprios.
const PALAVRAS_CHAVE_PADRAO = [
  'Mobiliário',
  'Móveis',
  'Móveis escolares',
  'Móveis de escritório',
  'Conjunto CJA',
  'Mesas',
  'Cadeiras',
];
