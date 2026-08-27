// ==========================================================================
// projects-render.js — busca os projetos em data/projects.json e cuida dos
// três estados de UI que a interface precisa expor claramente:
//   1. Carregando  → skeletons (já presentes no HTML, aria-busy="true")
//   2. Erro        → painel com mensagem + botão "Tentar novamente"
//   3. Vazio       → painel avisando que o filtro não encontrou resultados
//
// Observação: como o fetch busca um arquivo local (data/projects.json),
// o navegador bloqueia a requisição se você abrir o index.html direto do
// disco (file://). Sirva a pasta com um servidor local, por exemplo:
//   npx serve .
//   python -m http.server 5500
// ==========================================================================

import { qs, qsa, escapeHTML } from "./utils.js";

const DATA_URL = "data/projects.json";

let allProjects = [];
let activeFilter = "todos";

const CATEGORY_LABELS = {
  "html-css": "HTML/CSS",
  javascript: "JavaScript",
  api: "Consumo de API",
};

export async function initProjects() {
  const grid = qs("#projects-grid");
  const toolbar = qs(".projects-toolbar");

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    activeFilter = button.dataset.filter;
    qsa("[data-filter]", toolbar).forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip === button));
    });
    render(grid);
  });

  await loadProjects(grid);
}

async function loadProjects(grid) {
  setSkeletonState(grid);

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Falha ao carregar projetos (HTTP ${response.status})`);
    }
    allProjects = await response.json();
    render(grid);
  } catch (error) {
    console.error("Erro ao carregar projetos:", error);
    renderError(grid);
  }
}

function setSkeletonState(grid) {
  grid.setAttribute("aria-busy", "true");
  grid.innerHTML = Array.from({ length: 3 })
    .map(() => '<div class="skeleton skeleton-card" aria-hidden="true"></div>')
    .join("");
}

function render(grid) {
  grid.setAttribute("aria-busy", "false");

  const filtered =
    activeFilter === "todos"
      ? allProjects
      : allProjects.filter((project) => project.category === activeFilter);

  if (filtered.length === 0) {
    renderEmpty(grid);
    return;
  }

  grid.innerHTML = filtered.map(projectCardTemplate).join("");
}

function renderEmpty(grid) {
  grid.innerHTML = `
    <div class="state-panel" data-state="empty">
      <p>Nenhum projeto encontrado para este filtro ainda.</p>
    </div>
  `;
}

function renderError(grid) {
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = `
    <div class="state-panel" data-state="error">
      <p>Não foi possível carregar os projetos agora. Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn btn-secondary" id="retry-projects">Tentar novamente</button>
    </div>
  `;
  qs("#retry-projects", grid)?.addEventListener("click", () => loadProjects(grid));
}

function projectCardTemplate(project) {
  const categoryLabel = CATEGORY_LABELS[project.category] ?? project.category;

  return `
    <article class="project-card reveal">
      <div class="project-thumb">
        ${browserMockupSVG()}
      </div>
      <div class="project-card-body">
        <span class="badge badge-accent">${escapeHTML(categoryLabel)}</span>
        <h3>${escapeHTML(project.title)}</h3>
        <p>${escapeHTML(project.problem)}</p>

        <div class="badge-group" aria-label="Tecnologias usadas">
          ${project.stack.map((tech) => `<span class="badge">${escapeHTML(tech)}</span>`).join("")}
        </div>

        <dl class="project-detail-list">
          <dt>Layout</dt>
          <dd>${escapeHTML(project.ux.layout)}</dd>
          <dt>Wireframe / rationale</dt>
          <dd>${escapeHTML(project.ux.wireframe)}</dd>
          <dt>Acessibilidade aplicada</dt>
          <dd>${escapeHTML(project.ux.acessibilidade)}</dd>
          <dt>Desafios técnicos</dt>
          <dd>
            <ul>
              ${project.highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join("")}
            </ul>
          </dd>
        </dl>
      </div>
      <div class="project-card-footer">
        <div class="project-card-links">
          <a class="btn btn-secondary" href="${project.repo}" target="_blank" rel="noopener noreferrer">
            Código
          </a>
          <a class="btn btn-primary" href="${project.demo}" target="_blank" rel="noopener noreferrer">
            Ver deploy
          </a>
        </div>
      </div>
    </article>
  `;
}

function browserMockupSVG() {
  // Placeholder neutro (mockup de navegador) até você trocar por um
  // screenshot real do projeto — evita <img> quebrado.
  return `
    <svg viewBox="0 0 120 80" aria-hidden="true">
      <rect x="4" y="4" width="112" height="72" rx="6" fill="var(--color-bg-elevated)" stroke="var(--color-border)"/>
      <rect x="4" y="4" width="112" height="14" rx="6" fill="var(--color-bg-inset)"/>
      <circle cx="14" cy="11" r="2.5" fill="var(--color-border-strong)"/>
      <circle cx="22" cy="11" r="2.5" fill="var(--color-border-strong)"/>
      <circle cx="30" cy="11" r="2.5" fill="var(--color-border-strong)"/>
      <rect x="16" y="30" width="88" height="8" rx="3" fill="var(--color-border)"/>
      <rect x="16" y="44" width="60" height="6" rx="3" fill="var(--color-border)"/>
      <rect x="16" y="56" width="36" height="10" rx="3" fill="var(--color-accent-soft)"/>
    </svg>
  `;
}
