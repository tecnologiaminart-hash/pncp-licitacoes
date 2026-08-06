// Motivos de arquivamento. Fica só como constante no frontend (a coluna motivo_arquivamento
// no Supabase é texto livre, sem check constraint) para permitir adicionar motivos novos
// sem precisar de migração de banco.
const MOTIVOS_ARQUIVAMENTO = {
  nao_atende: 'Não atende',
  nao_tenho_interesse: 'Não tenho interesse',
  ja_analisei_descartado: 'Já analisei e descartei',
};
