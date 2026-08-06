// Configuração e criação do client do Supabase (Postgres + Auth) usado para persistir
// a classificação de licitações (pipeline comercial).
//
// SUPABASE_URL e SUPABASE_ANON_KEY são valores PÚBLICOS por design do Supabase: a chave
// "anon" não concede acesso nenhum por si só, ela só identifica o projeto. A segurança de
// verdade está nas políticas de Row Level Security (RLS) configuradas na tabela
// `licitacoes_pipeline` (cada usuário só enxerga/altera as próprias linhas). Por isso é
// seguro manter esses valores neste arquivo, versionado num repositório público servido
// pelo GitHub Pages.
//
// Preencha com os valores do seu projeto em Supabase → Settings → API.
const SUPABASE_URL = 'COLOQUE_AQUI_A_PROJECT_URL_DO_SUPABASE';
const SUPABASE_ANON_KEY = 'COLOQUE_AQUI_A_ANON_PUBLIC_KEY_DO_SUPABASE';

const SupabaseClient = (() => {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
})();
