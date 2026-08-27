// ==========================================================================
// utils.js — funções pequenas e reutilizáveis, sem estado próprio.
// Mantê-las isoladas facilita testar e reaproveitar em outros módulos.
// ==========================================================================

/** Atalho para querySelector, com escopo opcional. */
export const qs = (selector, scope = document) => scope.querySelector(selector);

/** Atalho para querySelectorAll já convertido em array. */
export const qsa = (selector, scope = document) =>
  Array.from(scope.querySelectorAll(selector));

/**
 * Debounce: adia a execução de `fn` até que `wait` ms se passem sem novas
 * chamadas. Usado na busca/filtro para não disparar trabalho a cada tecla.
 */
export function debounce(fn, wait = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Aprisiona o foco do teclado dentro de `container` (ex.: menu mobile aberto,
 * modal). Retorna uma função de limpeza para remover o listener.
 */
export function trapFocus(container) {
  const focusableSelector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function handleKeydown(event) {
    if (event.key !== "Tab") return;

    const focusable = qsa(focusableSelector, container).filter(
      (el) => el.offsetParent !== null
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", handleKeydown);
  return () => container.removeEventListener("keydown", handleKeydown);
}

/** Escapa texto antes de inserir via innerHTML, evitando XSS básico. */
export function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
