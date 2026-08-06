// Modal genérico (overlay + caixa), reutilizado pelos formulários de "Enviado proposta" e
// "Editar contrato". Quem chama monta o conteúdo (formulário) e passa pronto; este módulo só
// cuida de mostrar/esconder, fechar em Esc e fechar ao clicar fora da caixa.
const Modal = (() => {
  let elOverlay = null;
  let elCaixa = null;

  function garantirDom() {
    if (elOverlay) return;

    elOverlay = document.createElement('div');
    elOverlay.className = 'modal-overlay';
    elOverlay.hidden = true;

    elCaixa = document.createElement('div');
    elCaixa.className = 'modal-caixa';
    elCaixa.setAttribute('role', 'dialog');
    elCaixa.setAttribute('aria-modal', 'true');

    elOverlay.appendChild(elCaixa);
    document.body.appendChild(elOverlay);

    elOverlay.addEventListener('click', (evento) => {
      if (evento.target === elOverlay) fechar();
    });
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && elOverlay && !elOverlay.hidden) fechar();
    });
  }

  function abrir(conteudoEl) {
    garantirDom();
    elCaixa.innerHTML = '';
    elCaixa.appendChild(conteudoEl);
    elOverlay.hidden = false;
  }

  function fechar() {
    if (!elOverlay) return;
    elOverlay.hidden = true;
    elCaixa.innerHTML = '';
  }

  return { abrir, fechar };
})();
