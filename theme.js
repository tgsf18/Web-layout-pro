// ==========================================================================
// theme.js — alternância de tema claro/escuro com persistência em
// localStorage. Respeita a preferência do sistema operacional quando o
// usuário nunca escolheu manualmente um tema.
// ==========================================================================

const STORAGE_KEY = "portfolio:theme";

/** Lê o tema salvo, ou null se o usuário nunca escolheu um manualmente. */
function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // localStorage pode estar indisponível (modo privado, política do navegador).
    console.warn("Não foi possível ler o tema salvo:", error);
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Não foi possível salvar o tema escolhido:", error);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Inicializa o toggle de tema. Deve rodar o quanto antes (idealmente antes
 * do primeiro paint) para evitar "flash" do tema errado.
 */
export function initTheme(toggleButton) {
  const stored = getStoredTheme();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = stored ?? (prefersDark ? "dark" : "light");

  applyTheme(initialTheme);
  syncButton(toggleButton, initialTheme);

  toggleButton.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
    syncButton(toggleButton, next);
  });

  // Se o usuário nunca escolheu manualmente, acompanha mudanças do SO em tempo real.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (getStoredTheme()) return; // usuário já fez uma escolha explícita
    const next = event.matches ? "dark" : "light";
    applyTheme(next);
    syncButton(toggleButton, next);
  });
}

function syncButton(button, theme) {
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.dataset.mode = theme;
}
