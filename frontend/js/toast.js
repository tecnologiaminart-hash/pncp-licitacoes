// Aviso curto e temporário (toast), usado para reportar falha em ações de escrita
// (⭐/❌/📄 etc.) sem precisar de um banner fixo em cada uma das 5 abas.
const Toast = (() => {
  let elToast = null;
  let timeoutId = null;

  function garantirDom() {
    if (elToast) return;
    elToast = document.createElement('div');
    elToast.className = 'toast';
    elToast.hidden = true;
    elToast.setAttribute('role', 'alert');
    document.body.appendChild(elToast);
  }

  function mostrarErro(mensagem) {
    garantirDom();
    elToast.textContent = mensagem;
    elToast.hidden = false;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { elToast.hidden = true; }, 6000);
  }

  return { mostrarErro };
})();
