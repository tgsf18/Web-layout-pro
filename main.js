// ==========================================================================
// main.js — ponto de entrada. Só orquestra: importa cada módulo e injeta os
// elementos do DOM de que ele precisa. A lógica de verdade vive em
// js/modules/*, separada por responsabilidade única.
// ==========================================================================

import { initTheme } from "./modules/theme.js";
import { initNav } from "./modules/nav.js";
import { initProjects } from "./modules/projects-render.js";
import { initContactForm } from "./modules/contact-form.js";
import { qs, qsa } from "./modules/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme(qs("#theme-toggle"));

  initNav({
    toggleButton: qs("#nav-toggle"),
    nav: qs("#main-nav"),
    overlay: qs("#nav-overlay"),
  });

  initProjects();
  initContactForm(qs("#contact-form"));
  initRevealOnScroll();
  setFooterYear();
});

/**
 * Anima suavemente elementos .reveal ao entrarem na viewport, usando
 * IntersectionObserver (com fallback silencioso: se a API não existir,
 * o conteúdo simplesmente já aparece visível, sem quebrar nada).
 */
function initRevealOnScroll() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  // Observa elementos existentes e também os que o projects-render.js
  // insere depois (via MutationObserver, já que o fetch é assíncrono).
  const observeAll = () => qsa(".reveal").forEach((el) => observer.observe(el));
  observeAll();

  const gridObserver = new MutationObserver(observeAll);
  const grid = qs("#projects-grid");
  if (grid) gridObserver.observe(grid, { childList: true });
}

function setFooterYear() {
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
