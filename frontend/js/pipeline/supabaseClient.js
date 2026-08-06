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
const SUPABASE_URL = 'https://lfkzujgrarzrabhdxugs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma3p1amdyYXJ6cmFiaGR4dWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NzQ5NDEsImV4cCI6MjEwMTU1MDk0MX0.nkfGP0mbXt1Wde0Kw51qME7dSIA5CAJ7KRYNZdoGT7w';

const SupabaseClient = (() => {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
})();
