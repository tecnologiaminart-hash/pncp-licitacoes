// Autenticação (Supabase Auth, email/senha). Não existe tela de cadastro no app — o único
// usuário é criado manualmente no dashboard do Supabase (Authentication → Add user).
const PipelineAuth = (() => {
  async function login(email, senha) {
    const { data, error } = await SupabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzirErro(error));
    return data.session;
  }

  async function logout() {
    await SupabaseClient.auth.signOut();
  }

  async function obterSessaoAtual() {
    const { data } = await SupabaseClient.auth.getSession();
    return data.session;
  }

  /** Chama `callback(sessaoOuNull)` sempre que o estado de autenticação mudar (login/logout). */
  function aoMudarAutenticacao(callback) {
    SupabaseClient.auth.onAuthStateChange((_evento, sessao) => callback(sessao));
  }

  function traduzirErro(error) {
    if (error.message === 'Invalid login credentials') {
      return 'E-mail ou senha incorretos.';
    }
    return error.message || 'Não foi possível entrar. Tente novamente.';
  }

  return { login, logout, obterSessaoAtual, aoMudarAutenticacao };
})();
