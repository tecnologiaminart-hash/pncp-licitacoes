// Ponto de entrada do app: gate de autenticação (mostra login ou app-shell) e troca de abas
// da sidebar. Cada módulo de aba (js/tabs/*.js) expõe uma função `renderizar()` chamada
// sempre que a aba correspondente é ativada.
(() => {
  const elTelaLogin = document.getElementById('telaLogin');
  const elAppShell = document.getElementById('appShell');
  const elFormLogin = document.getElementById('formLogin');
  const elLoginEmail = document.getElementById('loginEmail');
  const elLoginSenha = document.getElementById('loginSenha');
  const elLoginErro = document.getElementById('loginErro');
  const elBtnLogin = document.getElementById('btnLogin');
  const elBtnSair = document.getElementById('btnSair');
  const botoesAba = document.querySelectorAll('.sidebar__aba');
  const paineis = document.querySelectorAll('.painel-aba');

  const ABAS = {
    buscar: { painelId: 'painel-buscar', renderizar: () => TabBuscar.renderizar() },
    'em-analise': { painelId: 'painel-em-analise', renderizar: () => TabEmAnalise.renderizar() },
    propostas: { painelId: 'painel-propostas', renderizar: () => TabPropostas.renderizar() },
    contratos: { painelId: 'painel-contratos', renderizar: () => TabContratos.renderizar() },
    arquivadas: { painelId: 'painel-arquivadas', renderizar: () => TabArquivadas.renderizar() },
  };

  let appJaMostrado = false;

  function mostrarAba(nomeAba) {
    const aba = ABAS[nomeAba];
    if (!aba) return;
    botoesAba.forEach((botao) => {
      botao.classList.toggle('sidebar__aba--ativa', botao.dataset.aba === nomeAba);
    });
    paineis.forEach((painel) => {
      painel.hidden = painel.id !== aba.painelId;
    });
    aba.renderizar();
  }

  function wireSidebar() {
    botoesAba.forEach((botao) => {
      botao.addEventListener('click', () => mostrarAba(botao.dataset.aba));
    });
    elBtnSair.addEventListener('click', () => PipelineAuth.logout());
  }

  function wireLogin() {
    elFormLogin.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      elLoginErro.textContent = '';
      elBtnLogin.disabled = true;
      try {
        await PipelineAuth.login(elLoginEmail.value.trim(), elLoginSenha.value);
      } catch (erro) {
        elLoginErro.textContent = erro.message;
      } finally {
        elBtnLogin.disabled = false;
      }
    });
  }

  function mostrarApp() {
    elTelaLogin.hidden = true;
    elAppShell.hidden = false;
    // Só troca para a aba inicial (e dispara a busca automática) na primeira vez que a
    // sessão fica ativa — eventos seguintes (ex.: renovação de token) não devem "puxar"
    // o usuário de volta para a aba Buscar se ele já estiver em outra.
    if (!appJaMostrado) {
      appJaMostrado = true;
      mostrarAba('buscar');
    }
  }

  function mostrarLogin() {
    appJaMostrado = false;
    elAppShell.hidden = true;
    elTelaLogin.hidden = false;
    elFormLogin.reset();
  }

  function inicializar() {
    wireSidebar();
    wireLogin();
    // onAuthStateChange já dispara imediatamente com a sessão atual ao ser registrado,
    // cobrindo tanto o carregamento inicial da página quanto login/logout subsequentes.
    PipelineAuth.aoMudarAutenticacao((sessao) => {
      if (sessao) mostrarApp();
      else mostrarLogin();
    });
  }

  document.addEventListener('DOMContentLoaded', inicializar);
})();
