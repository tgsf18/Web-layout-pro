// ==========================================================================
// nav.js — menu mobile acessível: abre/fecha, aprisiona foco, fecha com Esc
// e ao clicar fora, e devolve o foco ao botão que abriu o menu.
// ==========================================================================

import { trapFocus, qsa } from "./utils.js";

export function initNav({ toggleButton, nav, overlay }) {
  let releaseFocusTrap = null;

  function openNav() {
    nav.dataset.open = "true";
    overlay.hidden = false;
    // Força reflow antes de animar a opacidade do overlay.
    requestAnimationFrame(() => {
      overlay.dataset.open = "true";
    });
    toggleButton.setAttribute("aria-expanded", "true");
    releaseFocusTrap = trapFocus(nav);

    const firstLink = qsa("a", nav)[0];
    firstLink?.focus();

    document.addEventListener("keydown", handleKeydown);
    overlay.addEventListener("click", closeNav);
  }

  function closeNav() {
    nav.dataset.open = "false";
    overlay.dataset.open = "false";
    toggleButton.setAttribute("aria-expanded", "false");
    releaseFocusTrap?.();
    document.removeEventListener("keydown", handleKeydown);
    overlay.removeEventListener("click", closeNav);
    toggleButton.focus();

    // Espera a transição terminar antes de esconder o overlay do fluxo de acessibilidade.
    setTimeout(() => {
      if (nav.dataset.open === "false") overlay.hidden = true;
    }, 320);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") closeNav();
  }

  toggleButton.addEventListener("click", () => {
    const isOpen = nav.dataset.open === "true";
    isOpen ? closeNav() : openNav();
  });

  // Fecha o menu automaticamente ao navegar para uma seção (mobile).
  qsa("a", nav).forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.dataset.open === "true") closeNav();
    });
  });

  // Se a viewport crescer para desktop com o menu mobile aberto, reseta o estado.
  const desktopQuery = window.matchMedia("(min-width: 60rem)");
  desktopQuery.addEventListener("change", (event) => {
    if (event.matches && nav.dataset.open === "true") closeNav();
  });
}
