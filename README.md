# Portfólio — Thiago (Front-end)

Portfólio estático em **HTML5 + CSS3 + JavaScript puro (ES6+ / módulos)**, sem
build step e sem dependências externas além de fontes do Google Fonts.

## Estrutura de arquivos

```
portfolio/
├── index.html                # marcação semântica de todas as seções
├── data/
│   └── projects.json         # conteúdo dos cards de projeto (edite aqui)
├── css/
│   ├── variables.css         # design tokens: cor, tipografia, espaçamento
│   ├── base.css              # reset + estilos de elementos nativos
│   ├── layout.css            # header, nav, hero, grids das seções
│   ├── components.css        # botões, badges, cards, formulário, skeletons
│   └── utilities.css         # classes utilitárias (container, skip-link...)
├── js/
│   ├── main.js                # ponto de entrada — só orquestra os módulos
│   └── modules/
│       ├── theme.js           # dark/light mode + localStorage
│       ├── nav.js              # menu mobile acessível (focus trap, Esc)
│       ├── projects-render.js  # fetch + skeleton + estado vazio/erro
│       ├── contact-form.js     # validação + estados de envio
│       └── utils.js            # helpers (debounce, trapFocus, escapeHTML)
└── assets/                   # ícones/imagens (adicione as suas aqui)
```

Cada arquivo CSS/JS tem uma responsabilidade única — isso facilita achar o
que editar sem caçar em um arquivo gigante, e é o mesmo princípio de
"separation of concerns" que um projeto em React aplicaria com componentes.

## Como rodar localmente

O `projects-render.js` usa `fetch()` para carregar `data/projects.json`.
Navegadores bloqueiam `fetch` de arquivos abertos direto do disco
(`file://`), então sirva a pasta com um servidor local. Qualquer um destes
funciona:

```bash
# Opção 1 — Node (sem instalar nada globalmente)
npx serve .

# Opção 2 — Python
python3 -m http.server 5500

# Opção 3 — VS Code
# instale a extensão "Live Server" e clique em "Go Live"
```

Depois abra o endereço indicado (ex.: http://localhost:5500).

## O que personalizar antes de publicar

Busque por `TODO` no código — são os pontos que precisam da sua informação
real:

- `index.html`: nome, link do currículo (`curriculo.pdf`), usuário do
  GitHub/LinkedIn, e-mail de contato, favicon.
- `data/projects.json`: troque os 4 projetos de exemplo pelos seus projetos
  reais do curso (título, problema resolvido, stack, decisões de UI/UX,
  desafios técnicos, links de repositório e deploy).
- `js/modules/contact-form.js`: a função `submitForm` simula o envio com um
  `setTimeout`. Troque por uma integração real (Formspree, EmailJS, ou um
  endpoint próprio) — o `TODO` está marcado no arquivo.

## Decisões de UI/UX (resumo)

- **Paleta "editorial-tech"** (grafite + terracota) em vez do azul/roxo
  genérico de templates gerados por IA; cantos com raio discreto (4–12px,
  nunca "pill"); tipografia combinando uma serif de destaque (Fraunces) nos
  títulos com uma sans-serif (Inter) no corpo, para dar identidade sem
  comprometer a leitura.
- **Mobile-first real**: todo CSS parte do layout de 320px e cresce via
  `min-width`; testado manualmente em 320px, 768px, 1024px e 1440px.
- **Dark/Light mode**: os tokens de cor vivem em `variables.css` como
  variáveis CSS; o tema segue `prefers-color-scheme` por padrão e pode ser
  sobrescrito manualmente pelo botão no header (persistido em
  `localStorage`), sem flash do tema errado ao recarregar.
- **Acessibilidade (WCAG 2.1 AA)**: skip link, `:focus-visible` consistente
  em todo o site, landmarks semânticos (`header`, `nav`, `main`, `section`,
  `footer`), formulário com `aria-describedby`/`role="alert"` nos erros,
  contraste de texto verificado nos dois temas, e `prefers-reduced-motion`
  respeitado nas animações.
- **Estados de UI explícitos**: a seção de projetos mostra skeletons
  enquanto carrega, uma mensagem com botão "Tentar novamente" se o fetch
  falhar, e um painel de "nenhum projeto encontrado" quando um filtro não
  retorna resultados — em vez de simplesmente não mostrar nada.

## Deploy

Como é um site 100% estático, funciona em qualquer hospedagem gratuita:
GitHub Pages, Netlify ou Vercel (sem configuração de build — aponte
diretamente para a pasta `portfolio/`).
