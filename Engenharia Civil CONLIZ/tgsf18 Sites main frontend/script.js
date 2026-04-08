const Conliz = {
  users: [
    { id: 1, nome: 'Admin Conliz', username: 'admin', email: 'admin@conliz.com', senha: 'conliz123', cargo: 'admin', foto_perfil: null },
    { id: 2, nome: 'Cliente Demo', username: 'cliente', email: 'cliente@conliz.com', senha: 'cliente123', cargo: 'cliente', foto_perfil: null },
  ],

  getUsers() {
    const stored = localStorage.getItem('conliz_users');
    if (!stored) {
      localStorage.setItem('conliz_users', JSON.stringify(this.users));
      return [...this.users];
    }

    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [...this.users];
    } catch {
      return [...this.users];
    }
  },

  setUsers(users) {
    localStorage.setItem('conliz_users', JSON.stringify(users));
  },

  getCurrentUser() {
    const stored = localStorage.getItem('conliz_user');
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem('conliz_user');
      return;
    }

    const safeUser = { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo };
    localStorage.setItem('conliz_user', JSON.stringify(safeUser));
  },

  logout() {
    this.setCurrentUser(null);
    localStorage.removeItem('conliz_token');
    localStorage.removeItem('conliz_user');
    localStorage.removeItem('conliz_users');
    sessionStorage.clear();
    window.location.replace('login.html');
    setTimeout(() => { window.location.reload(true); }, 300);
  },

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setYear();
      this.setupNav();
      this.setActiveLink();
      this.updateAuthUI();
      this.ensureAuth();
      this.initSharedUI();
      this.initPage();
    });
  },

  setYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  },

  setupNav() {
    const nav = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const links = [...document.querySelectorAll('.nav-link')];

    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
    links.forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') nav.classList.remove('open');
    });
  },

  setActiveLink() {
    const currentPage = document.documentElement.dataset.page || '';
    document.querySelectorAll('.nav-link').forEach((link) => {
      if ((link.dataset.nav || '') === currentPage) link.classList.add('active');
    });
  },

  updateAuthUI() {
    const user = this.getCurrentUser();
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    // Elementos existentes
    const loginLink = navList.querySelector('a[href="login.html"]');
    const loginItem = loginLink ? loginLink.parentElement : null;
    
    // Limpa itens dinâmicos antigos para evitar duplicação
    const dynamicItems = navList.querySelectorAll('.auth-dynamic-item');
    dynamicItems.forEach(el => el.remove());

    if (user) {
      // Esconde o botão de Login
      if (loginItem) loginItem.style.display = 'none';

      // 1. Link de Admin (se for admin)
      if (user.cargo === 'admin') {
        const liAdmin = document.createElement('li');
        liAdmin.className = 'auth-dynamic-item';
        liAdmin.innerHTML = `<a href="admin-portfolio.html" class="nav-link admin-link-highlight" style="color: #ff9f43 !important;">Administração</a>`;
        navList.appendChild(liAdmin);
      }

      // 2. Avatar do Usuário
      const liAvatar = document.createElement('li');
      liAvatar.className = 'auth-dynamic-item';
      
      if (user.foto_perfil) {
        liAvatar.innerHTML = `<img src="${user.foto_perfil}" class="user-avatar custom-icon" title="Logado como ${user.nome}" alt="${user.nome}">`;
      } else {
        const initials = (user.nome || 'U').charAt(0).toUpperCase();
        liAvatar.innerHTML = `<div class="user-avatar" title="Logado como ${user.nome}">${initials}</div>`;
      }
      navList.appendChild(liAvatar);

      // 3. Botão Logout
      const liLogout = document.createElement('li');
      liLogout.className = 'auth-dynamic-item';
      liLogout.innerHTML = `<button onclick="Conliz.logout()" class="nav-link btn-ghost" style="padding: 0.5rem 1rem; border-radius: 99px; cursor: pointer; font-size: 0.9rem;">Sair</button>`;
      navList.appendChild(liLogout);

    } else {
      // Se não estiver logado, garante que o botão de Login apareça
      if (loginItem) loginItem.style.display = '';
    }
  },

  ensureAuth() {},

  initSharedUI() {
    this.initLazyMedia();
    this.initCategoryFilters();
  },

  initPage() {
    const page = document.documentElement.dataset.page;

    switch (page) {
      case 'home':
        this.initHome();
        break;
      case 'orcamento':
        this.initBudgetForm();
        break;
      case 'materiais':
        this.initMaterialCalculator();
        break;
      case 'portfolio':
        this.initPortfolioSlider();
        this.loadPortfolioItems();
        break;
      case 'projeto-detalhe':
        this.initProjectDetails();
        break;
      case 'admin-portfolio':
        this.initAdminPortfolio();
        break;
      case 'admin-portfolio-list':
        this.loadAdminPortfolioItems();
        break;
      case 'insumos':
        if (Conliz.Insumos) Conliz.Insumos.init();
        break;
      case 'blog':
        this.initCategoryFilters();
        break;
      case 'login':
        this.initLogin();
        break;
      default:
        break;
    }
  },

  initHome() {
    const user = this.getCurrentUser();
    // Se for admin, mostra os botões de orçamento
    if (user && user.cargo === 'admin') {
      const btnRequest = document.getElementById('btnRequestBudget');
      const btnCta = document.getElementById('btnCtaBudget');
      if (btnRequest) btnRequest.style.display = '';
      if (btnCta) btnCta.style.display = '';
    }
  },

  initLazyMedia() {
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('loading') && !img.closest('.hero-media')) img.loading = 'lazy';
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
    });
  },

  initCategoryFilters() {
    document.querySelectorAll('.filter-chip').forEach((button) => {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => {
        const targetSelector = button.dataset.filterTarget;
        if (!targetSelector) return;
        const category = button.dataset.filter || 'all';
        const container = document.querySelector(targetSelector);
        if (!container) return;

        document.querySelectorAll(`.filter-chip[data-filter-target="${targetSelector}"]`).forEach((chip) => {
          chip.classList.toggle('is-active', chip === button);
        });

        container.querySelectorAll('[data-category]').forEach((item) => {
          const matches = category === 'all' || item.dataset.category === category;
          item.classList.toggle('is-hidden', !matches);
        });
      });
    });
  },

  parseNumericValue(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const normalized = String(value).replace(/\s/g, '').replace(/R\$/gi, '').replace(/m�|kg|litros|%/gi, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  formatDecimal(value, digits = 0) {
    return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  },

  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatWithUnit(value, unit, digits = 0) {
    if (!value) return '-';
    return `${this.formatDecimal(value, digits)} ${unit}`.trim();
  },

  digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  },

  applyMaskValue(field) {
    const mask = field.dataset.mask;
    if (!mask) return;

    if (mask === 'phone') {
      const digits = this.digitsOnly(field.value).slice(0, 11);
      field.value = digits.length > 10 ? digits.replace(/(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3') : digits.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => `(${a}${b ? `) ${b}` : ''}${c ? `-${c}` : ''}`);
      return;
    }

    if (mask === 'cpf-cnpj') {
      const digits = this.digitsOnly(field.value).slice(0, 14);
      field.value = digits.length <= 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, (_, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ''}`) : digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/, (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? `-${e}` : ''}`);
      return;
    }

    const number = this.parseNumericValue(field.value);
    if (field.value.trim() === '') {
      field.value = '';
      return;
    }

    if (mask === 'currency') {
      field.value = this.formatCurrency(number);
      return;
    }

    const units = { m2: 'm�', kg: 'kg', litros: 'litros', percent: '%' };
    const digits = mask === 'percent' ? 0 : number % 1 === 0 ? 0 : 2;
    field.value = `${this.formatDecimal(number, digits)} ${units[mask] || ''}`.trim();
  },

  setupMasks(form) {
    form.querySelectorAll('[data-mask]').forEach((field) => {
      this.applyMaskValue(field);
      field.addEventListener('input', () => this.applyMaskValue(field));
      field.addEventListener('blur', () => this.applyMaskValue(field));
    });
  },

  getFieldError(field) {
    const rawValue = field.value.trim();
    const numericValue = this.parseNumericValue(rawValue);
    const validation = field.dataset.validate;
    if (field.required && !rawValue) return 'Preencha este campo.';
    if (!rawValue) return '';

    switch (validation) {
      case 'required': return rawValue ? '' : 'Selecione uma opcao.';
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue) ? '' : 'Informe um email valido.';
      case 'phone': return this.digitsOnly(rawValue).length >= 10 ? '' : 'Informe um telefone valido.';
      case 'name': return rawValue.length >= 3 ? '' : 'Informe o nome completo.';
      case 'positive-number': return numericValue > 0 ? '' : 'Informe um valor maior que zero.';
      case 'non-negative-number': return numericValue >= 0 ? '' : 'Informe um valor valido.';
      default: return '';
    }
  },

  setFieldState(field, error) {
    const group = field.closest('.input-group');
    if (!group) return !error;
    let errorEl = group.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      group.appendChild(errorEl);
    }

    field.setAttribute('aria-invalid', error ? 'true' : 'false');
    errorEl.textContent = error;
    group.classList.toggle('has-error', Boolean(error));
    group.classList.toggle('is-valid', !error && field.value.trim() !== '');
    if (!error) errorEl.textContent = '';
    return !error;
  },

  validateField(field) {
    return this.setFieldState(field, this.getFieldError(field));
  },

  setupRealtimeValidation(form) {
    [...form.querySelectorAll('input, select, textarea')].forEach((field) => {
      const validate = () => this.validateField(field);
      field.addEventListener('input', validate);
      field.addEventListener('blur', validate);
      field.addEventListener('change', validate);
    });
  },

  validateForm(form) {
    return [...form.querySelectorAll('input, select, textarea')].every((field) => this.validateField(field));
  },
  initLogin() {
    const loginFormContainer = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerFormContainer = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const authToggle = document.getElementById('authToggle');
    const loginToggle = document.getElementById('loginToggle');
    const toggleLogin = document.getElementById('togglePasswordLogin');
    const toggleRegister = document.getElementById('togglePasswordRegister');
    const loginSubmit = document.getElementById('loginSubmit');
    const registerSubmit = document.getElementById('registerSubmit');
    const loginSpinner = document.getElementById('loginSpinner');
    const registerSpinner = document.getElementById('registerSpinner');
    if (!loginFormContainer) return;

    const setMode = (mode) => {
      const isRegister = mode === 'register';
      loginFormContainer.classList.toggle('hide', isRegister);
      registerFormContainer?.classList.toggle('hide', !isRegister);
      authToggle?.classList.toggle('hide', isRegister);
      loginToggle?.classList.toggle('hide', !isRegister);
      if (loginMessage) loginMessage.textContent = '';
      if (registerMessage) registerMessage.textContent = '';
    };

    showRegister?.addEventListener('click', () => setMode('register'));
    showLogin?.addEventListener('click', () => setMode('login'));
    toggleLogin?.addEventListener('change', (event) => {
      const input = document.getElementById('senha');
      if (input) input.type = event.target.checked ? 'text' : 'password';
    });
    toggleRegister?.addEventListener('change', (event) => {
      const pass1 = document.getElementById('regSenha');
      const pass2 = document.getElementById('regSenhaConfirm');
      if (pass1) pass1.type = event.target.checked ? 'text' : 'password';
      if (pass2) pass2.type = event.target.checked ? 'text' : 'password';
    });

    document.getElementById('resetDemo')?.addEventListener('click', () => {
      localStorage.clear();
      this.showMessage(loginMessage, 'Dados do demo removidos. Recarregue a pagina e use admin/conliz123.');
      setMode('login');
    });

    const showSpinner = (btn, spinner, show) => {
      if (btn) btn.disabled = show;
      if (spinner) spinner.classList.toggle('hide', !show);
    };

    const loginFormElement = loginFormContainer.querySelector('form');
    loginFormElement?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(loginFormElement));

      // Remove espaços nas extremidades e atualiza os inputs visualmente
      const usernameClean = (data.usuario || '').trim();
      const passwordClean = (data.senha || '').trim();
      
      const userInput = loginFormElement.querySelector('input[name="usuario"]');
      const passInput = loginFormElement.querySelector('input[name="senha"]');
      if (userInput) userInput.value = usernameClean;
      if (passInput) passInput.value = passwordClean;

      const username = usernameClean.toLowerCase();
      const password = passwordClean;

      if (!username || !password) {
        this.showMessage(loginMessage, 'Preencha usuario e senha.');
        return;
      }

      if (/\s/.test(username) || /\s/.test(password)) {
        this.showMessage(loginMessage, 'Usuário e senha não podem conter espaços.');
        return;
      }

      showSpinner(loginSubmit, loginSpinner, true);
      
      // Simulação de delay de rede
      setTimeout(() => {
        const users = this.getUsers();
        const user = users.find((u) => u.username === username || u.email === username);
        if (!user || user.senha !== password) {
          this.showMessage(loginMessage, 'Usuário ou senha incorretos.');
          showSpinner(loginSubmit, loginSpinner, false);
          return;
        }

        try {
          this.setCurrentUser(user);
          this.showMessage(loginMessage, 'Login realizado! Redirecionando...');
          // Pequeno delay para ler a mensagem
          setTimeout(() => {
             window.location.href = 'index.html';
          }, 800);
        } catch (error) {
          this.showMessage(loginMessage, 'Erro ao processar login.');
        }
      }, 600);
    });

    const registerFormElement = registerFormContainer?.querySelector('form');
    registerFormElement?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(registerFormElement));
      const nome = (data.nome || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const username = (data.usuario || '').trim().toLowerCase();
      const senha = (data.senha || '').trim();
      const senhaConfirm = (data.senhaConfirm || '').trim();
      if (!nome || !email || !username || !senha) {
        this.showMessage(registerMessage, 'Preencha todos os campos para se cadastrar.');
        return;
      }

      if (senha !== senhaConfirm) {
        this.showMessage(registerMessage, 'As senhas nao coincidem.');
        return;
      }

      showSpinner(registerSubmit, registerSpinner, true);
      
      setTimeout(() => {
        const users = this.getUsers();
        const exists = users.some((u) => u.email === email || u.username === username);
        if (exists) {
          this.showMessage(registerMessage, 'Já existe um usuário com esse email ou usuário.');
          showSpinner(registerSubmit, registerSpinner, false);
          return;
        }

        const id = `u-${Date.now()}`;
        const newUser = { id, nome, username, email, senha, cargo: 'cliente', foto_perfil: null };
        users.push(newUser);
        this.setUsers(users);
        this.setCurrentUser(newUser);
        this.showMessage(registerMessage, 'Cadastro realizado! Redirecionando...');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
        showSpinner(registerSubmit, registerSpinner, false);
      }, 600);
    });

    setMode('login');
  },

  showMessage(container, text) {
    if (!container) return;
    container.textContent = text;
    container.classList.add('message-box');
    clearTimeout(container.messageTimeout);
    container.messageTimeout = setTimeout(() => {
      container.textContent = '';
      container.classList.remove('message-box');
    }, 6000);
  },

  getBudgetFormData(form) {
    const raw = Object.fromEntries(new FormData(form));
    return { ...raw, areaValue: this.parseNumericValue(raw.area), budgetValue: this.parseNumericValue(raw.budget), newsletter: raw.newsletter === 'on', generatedAt: new Date() };
  },

  buildBudgetSummary(data) {
    const budgetText = data.budgetValue ? `com investimento previsto de ${this.formatCurrency(data.budgetValue)}` : 'com investimento a definir';
    const prazoText = data.prazo || 'prazo ainda em definicao';
    const details = data.mensagem ? ` Observacoes principais: ${data.mensagem}.` : '';
    return `${data.nome || 'Cliente'} solicitou uma proposta para obra ${String(data.tipo || 'nao informada').toLowerCase()} com area aproximada de ${this.formatWithUnit(data.areaValue, 'm�')}, ${budgetText} e expectativa de inicio em ${prazoText}.${details}`;
  },

  renderBudgetPreview(data) {
    const fields = {
      previewNome: data.nome || '-',
      previewEmail: data.email || '-',
      previewTelefone: data.telefone || '-',
      previewCpf: data.cpf || 'Nao informado',
      previewEndereco: data.endereco || 'Nao informado',
      previewTipo: data.tipo || '-',
      previewArea: this.formatWithUnit(data.areaValue, 'm�'),
      previewPrazo: data.prazo || 'Nao definido',
      previewBudget: data.budgetValue ? this.formatCurrency(data.budgetValue) : 'Nao informado',
      previewMensagem: data.mensagem || 'Nenhuma observacao.',
      previewSummary: this.buildBudgetSummary(data),
      previewData: `${data.generatedAt.toLocaleDateString('pt-BR')} �s ${data.generatedAt.toLocaleTimeString('pt-BR')}`,
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  },

  toggleBudgetPreview(show) {
    const preview = document.getElementById('budgetPreview');
    if (!preview) return;
    preview.hidden = !show;
    if (show) preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  openBudgetPrint(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return false;
    printWindow.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>Orcamento - Conliz Engenharia</title><style>body{font-family:Arial,sans-serif;padding:32px;max-width:820px;margin:0 auto;color:#15233e}.sheet{border:1px solid #d8e0eb;border-radius:20px;padding:28px;background:#fff}h1{margin:0;color:#0f1f3c}.muted{color:#53617b}.grid{display:grid;gap:12px;margin-top:18px}.field{padding:14px;border-radius:14px;background:#f5f8fc;border:1px solid #d8e0eb}.actions{margin-top:24px;text-align:center}button{padding:12px 24px;font-size:15px;cursor:pointer}@media print{.actions{display:none}body{padding:0}.sheet{border:0}}</style></head><body><section class="sheet"><p class="muted">Proposta tecnica</p><h1>Resumo do seu orcamento</h1><p class="muted">${data.generatedAt.toLocaleDateString('pt-BR')} �s ${data.generatedAt.toLocaleTimeString('pt-BR')}</p><div class="grid"><div class="field"><strong>Cliente:</strong> ${data.nome || '-'}</div><div class="field"><strong>Contato:</strong> ${data.email || '-'} | ${data.telefone || '-'}</div><div class="field"><strong>Documento:</strong> ${data.cpf || 'Nao informado'}</div><div class="field"><strong>Endereco:</strong> ${data.endereco || 'Nao informado'}</div><div class="field"><strong>Tipo de obra:</strong> ${data.tipo || '-'}</div><div class="field"><strong>Area e prazo:</strong> ${this.formatWithUnit(data.areaValue, 'm�')} | ${data.prazo || 'Nao definido'}</div><div class="field"><strong>Orcamento disponivel:</strong> ${data.budgetValue ? this.formatCurrency(data.budgetValue) : 'Nao informado'}</div><div class="field"><strong>Resumo:</strong> ${this.buildBudgetSummary(data)}</div><div class="field"><strong>Observacoes:</strong> ${data.mensagem || 'Nenhuma observacao.'}</div></div></section><div class="actions"><button onclick="window.print()">Imprimir</button></div></body></html>`);
    printWindow.document.close();
    return true;
  },

  initBudgetForm() {
    const form = document.getElementById('budgetForm');
    const message = document.getElementById('budgetMessage');
    const btnPreview = document.getElementById('btnPreview');
    const btnPrint = document.getElementById('btnPrint');
    const btnDownloadPDF = document.getElementById('btnDownloadPDF');
    if (!form) return;

    this.setupMasks(form);
    this.setupRealtimeValidation(form);
    const syncPreview = () => this.renderBudgetPreview(this.getBudgetFormData(form));
    form.addEventListener('input', syncPreview);
    form.addEventListener('change', syncPreview);
    syncPreview();

    btnPreview?.addEventListener('click', () => {
      if (!this.validateForm(form)) {
        this.showMessage(message, 'Revise os campos destacados antes de visualizar o resumo.');
        return;
      }
      syncPreview();
      this.toggleBudgetPreview(true);
    });

    btnPrint?.addEventListener('click', () => {
      if (!this.validateForm(form)) {
        this.showMessage(message, 'Preencha os campos obrigatorios antes de imprimir.');
        return;
      }
      const data = this.getBudgetFormData(form);
      this.renderBudgetPreview(data);
      this.toggleBudgetPreview(true);
      if (this.openBudgetPrint(data)) this.showMessage(message, 'Janela de impressao aberta!');
    });

    btnDownloadPDF?.addEventListener('click', () => {
      if (!this.validateForm(form)) {
        this.showMessage(message, 'Preencha os campos obrigatorios antes de gerar o PDF.');
        return;
      }
      const data = this.getBudgetFormData(form);
      this.createProfessionalPdf(data);
      this.showMessage(message, 'PDF baixado com sucesso!');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.validateForm(form)) {
        this.showMessage(message, 'Preencha os campos obrigatorios (*) e corrija os dados destacados.');
        return;
      }

      const data = this.getBudgetFormData(form);
      this.renderBudgetPreview(data);
      this.toggleBudgetPreview(true);
      const requests = JSON.parse(localStorage.getItem('budget_requests') || '[]');
      requests.unshift({ id: `BR-${Date.now()}`, ...data, resumo: this.buildBudgetSummary(data), data: data.generatedAt.toISOString(), status: 'pendente' });
      localStorage.setItem('budget_requests', JSON.stringify(requests));
      this.showMessage(message, 'Orcamento enviado com sucesso! Entraremos em contato em breve.');
      form.reset();
      form.querySelectorAll('.input-group').forEach((group) => group.classList.remove('has-error', 'is-valid'));
      form.querySelectorAll('[aria-invalid]').forEach((field) => field.setAttribute('aria-invalid', 'false'));
      syncPreview();
      this.toggleBudgetPreview(false);
    });
  },
  createProfessionalPdf(data) {
    if (!window.jspdf || !window.jspdf.jsPDF) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = 20;

    doc.setFillColor(11, 23, 50);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Conliz Engenharia', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Engenharia Civil de Alto Padrao', margin, 33);
    doc.setFontSize(8);
    doc.text('contato@conliz.com.br', pageWidth - margin - 50, 15);
    doc.text('(11) 4000-0000', pageWidth - margin - 50, 22);

    y = 50;
    doc.setTextColor(29, 123, 230);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Orcamento de Obra - Proposta Tecnica', margin, y);
    y += 5;
    doc.setDrawColor(29, 123, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    const sections = [
      ['DADOS DO CLIENTE', [['Nome:', data.nome || 'Nao informado'], ['Email:', data.email || 'Nao informado'], ['Telefone:', data.telefone || 'Nao informado'], ['CPF/CNPJ:', data.cpf || 'Nao informado'], ['Endereco:', data.endereco || 'Nao informado']]],
      ['DADOS DO PROJETO', [['Tipo de Obra:', data.tipo || 'Nao informado'], ['Area Estimada:', this.formatWithUnit(data.areaValue, 'm�')], ['Prazo Desejado:', data.prazo || 'Nao definido'], ['Orcamento Disponivel:', data.budgetValue ? this.formatCurrency(data.budgetValue) : 'Nao informado']]],
      ['RESUMO DINAMICO', [['Resumo:', this.buildBudgetSummary(data)]]],
      ['OBSERVACOES', [['Notas:', data.mensagem || 'Nenhuma observacao informada.']]],
    ];

    sections.forEach(([title, rows]) => {
      doc.setTextColor(11, 23, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 8;
      rows.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value), maxWidth - 40);
        doc.text(lines, margin + 40, y);
        y += Math.max(6, lines.length * 5);
      });
      y += 6;
    });

    doc.setDrawColor(29, 123, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.text(`Orcamento gerado em ${data.generatedAt.toLocaleDateString('pt-BR')} as ${data.generatedAt.toLocaleTimeString('pt-BR')}`, margin, y);
    y += 5;
    doc.text('Conliz Engenharia - contato@conliz.com.br - (11) 4000-0000', margin, y);
    y += 5;
    doc.setFontSize(7);
    doc.text('Este orcamento e uma estimativa sujeita a analise tecnica detalhada.', margin, y);

    const filename = `orcamento-${(data.nome || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${data.generatedAt.toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    doc.save(filename);
  },

  calculateMaterials(data) {
    const area = this.parseNumericValue(data.area);
    const consumo = this.parseNumericValue(data.consumo);
    const litrosPorSaco = this.parseNumericValue(data.litros);
    const reserva = this.parseNumericValue(data.reserva);
    const fatorReserva = 1 + (reserva / 100);
    const massaTotalKg = area * consumo * fatorReserva;
    const sacosArgamassa = Math.ceil(massaTotalKg / 20);
    const aguaTotal = sacosArgamassa * litrosPorSaco;
    return { area, consumo, reserva, massaTotalKg, sacosArgamassa, aguaTotal };
  },

  renderMaterialResult(resultBox, result) {
    resultBox.innerHTML = `<div class="result-grid"><div class="result-item"><strong>Argamassa estimada</strong>${this.formatWithUnit(result.massaTotalKg, 'kg')}</div><div class="result-item"><strong>Sacos de 20 kg</strong>${this.formatDecimal(result.sacosArgamassa)}</div><div class="result-item"><strong>Agua para preparo</strong>${this.formatWithUnit(result.aguaTotal, 'litros')}</div></div><p class="form-note">Estimativa para ${this.formatWithUnit(result.area, 'm�')} considerando consumo medio de ${this.formatWithUnit(result.consumo, 'kg')} e reserva de ${this.formatDecimal(result.reserva)}%.</p>`;
  },

  initMaterialCalculator() {
    const form = document.getElementById('calculatorForm');
    const resultBox = document.getElementById('materialResult');
    if (!form || !resultBox) return;
    this.setupMasks(form);
    this.setupRealtimeValidation(form);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!this.validateForm(form)) return;
      const data = Object.fromEntries(new FormData(form));
      this.renderMaterialResult(resultBox, this.calculateMaterials(data));
    });
  },

  initPortfolioSlider() {
    const range = document.getElementById('portfolioRange');
    const images = document.querySelector('.slider-images');
    if (!range || !images) return;
    range.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      images.style.transform = `translateX(-${(value / 100) * 50}%)`;
    });
  },

  // --- DETALHES DO PROJETO (NOVA PÁGINA) ---
  initProjectDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      window.location.href = 'portfolio.html';
      return;
    }

    const items = JSON.parse(localStorage.getItem('conliz_portfolio') || '[]');
    // Como estamos usando índice ou timestamp como ID no localStorage simples
    // Vamos tentar achar por ID se existir, ou pelo índice se for numérico simples
    let project = items.find(i => String(i.id) === id);
    
    // Fallback para index se não tiver ID explícito (compatibilidade com dados antigos)
    if (!project && !isNaN(id) && items[id]) {
      project = items[id];
    }

    if (!project) {
      document.querySelector('main').innerHTML = '<div class="container"><p>Projeto não encontrado.</p><a href="portfolio.html" class="btn btn-primary">Voltar</a></div>';
      return;
    }

    // Preenche os dados
    document.getElementById('projectTitle').textContent = project.titulo;
    document.getElementById('projectCategory').textContent = project.categoria;
    document.getElementById('projectDesc').textContent = project.descricao_detalhada || project.descricao || 'Sem descrição disponível.';
    
    // Galeria
    const galleryGrid = document.getElementById('projectGallery');
    if (galleryGrid) {
      let images = [];
      
      // Se tiver galeria salva, usa ela. Senão, usa a imagem principal como única
      if (project.galeria && Array.isArray(project.galeria) && project.galeria.length > 0) {
        images = project.galeria;
      } else {
        images = [project.imagem_url];
      }

      galleryGrid.innerHTML = images.map(src => `<img src="${src.trim()}" alt="Foto da obra" loading="lazy">`).join('');
    }
  },

  // --- LÓGICA DO PORTFÓLIO DINÂMICO ---

  async loadPortfolioItems() {
    const gallery = document.querySelector('.portfolio-gallery');
    if (!gallery) return;

    // Simula delay
    setTimeout(() => {
      const items = JSON.parse(localStorage.getItem('conliz_portfolio') || '[]');

      if (items.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #53617b; padding: 2rem;">Nenhum projeto encontrado. Adicione itens através do painel administrativo.</p>';
        return;
      }

      // Limpa e renderiza os novos
      gallery.innerHTML = items.map((item, index) => `
        <article class="card media-card portfolio-item" data-category="${item.categoria.toLowerCase()}" data-index="${index}">
          <img src="${item.imagem_url}" alt="${item.titulo}" loading="lazy">
          <div class="media-card-body">
            <span class="pill">${item.categoria}</span>
            <h3>${item.titulo}</h3>
            <p>${item.descricao || ''}</p>
            <a href="projeto.html?id=${item.id || index}" class="btn btn-outline btn-small" style="margin-top: 1rem; width: 100%;">Ver Detalhes da Obra</a>
          </div>
        </article>
      `).join('');

      // Re-inicializa filtros pois o DOM mudou
      this.initCategoryFilters();
    }, 100);
  },

  initAdminPortfolio() {
    const form = document.getElementById('adminPortfolioForm');
    const msg = document.getElementById('adminMessage');
    
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));

      // Processa as URLs da galeria (quebra por linha e remove vazios)
      const galeriaUrls = (data.galeria_urls || '')
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const items = JSON.parse(localStorage.getItem('conliz_portfolio') || '[]');
      // Salva o objeto completo com a nova propriedade galeria
      items.unshift({ ...data, galeria: galeriaUrls, id: Date.now() });
      localStorage.setItem('conliz_portfolio', JSON.stringify(items));

      this.showMessage(msg, 'Item adicionado ao portfólio com sucesso! (Local)');
      form.reset();
    });
    
    // Carrega a lista inicial
    this.loadAdminPortfolioItems();
  },

  loadAdminPortfolioItems() {
    const gallery = document.getElementById('adminPortfolioGallery');
    if (!gallery) return;

    const items = JSON.parse(localStorage.getItem('conliz_portfolio') || '[]');

    if (items.length === 0) {
      gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #53617b;">Nenhum projeto cadastrado.</p>';
      return;
    }

    gallery.innerHTML = items.map((item, index) => `
      <article class="card media-card portfolio-item">
        <img src="${item.imagem_url}" alt="${item.titulo}" loading="lazy" style="height: 200px; object-fit: cover;">
        <div class="media-card-body">
          <span class="pill">${item.categoria}</span>
          <h3>${item.titulo}</h3>
          <p>${item.descricao || ''}</p>
          <button class="btn btn-danger btn-small delete-portfolio-btn" data-index="${index}" style="margin-top: 1rem; width: 100%; background-color: #ef4444; color: white; border: none;">Excluir Projeto</button>
        </div>
      </article>
    `).join('');

    gallery.querySelectorAll('.delete-portfolio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
          const currentItems = JSON.parse(localStorage.getItem('conliz_portfolio') || '[]');
          currentItems.splice(index, 1);
          localStorage.setItem('conliz_portfolio', JSON.stringify(currentItems));
          this.loadAdminPortfolioItems(); // Atualiza a tela
        }
      });
    });
  }
};

const Dashboard = {
  selectors: {
    tabs: [...document.querySelectorAll('.sidebar-link')],
    contents: [...document.querySelectorAll('.tab-content')],
    userName: document.getElementById('currentUserName'),
    userAvatar: document.getElementById('userAvatar'),
    logoutBtn: document.getElementById('logoutBtn'),
    toast: document.getElementById('toast'),
    whatsapp: document.getElementById('whatsappButton'),
  },

  init() {
    this.user = Conliz.getCurrentUser();
    if (!this.user) {
      window.location.href = 'login.html';
      return;
    }
    this.applyRoleRestrictions();
    this.setupTabs();
    this.renderUserInfo();
    this.renderProjects();
    this.initProjectForm();
    this.initFinanceChart();
    this.initDiary();
    this.initSchedule();
    this.initUserManagement();
    this.setupLogout();
    this.setupWhatsapp();
    this.initExportReport();
  },

  applyRoleRestrictions() {
    if (this.user?.cargo !== 'admin') document.querySelectorAll('.sidebar-link[data-role="admin"]').forEach((tab) => tab.remove());
  },

  setupTabs() {
    this.selectors.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.openTab(tab.dataset.tab);
        this.selectors.tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  },

  openTab(tabId) {
    this.selectors.contents.forEach((content) => content.classList.toggle('active', content.id === tabId));
  },

  renderUserInfo() {
    if (this.selectors.userName) this.selectors.userName.textContent = this.user.nome || 'Usuario';
    if (this.selectors.userAvatar) this.selectors.userAvatar.textContent = (this.user.nome || 'U').split(' ').slice(0, 2).map((t) => t.charAt(0).toUpperCase()).join('');
  },

  setupLogout() {
    if (!this.selectors.logoutBtn) return;
    this.selectors.logoutBtn.addEventListener('click', () => Conliz.logout());
  },

  setupWhatsapp() {
    if (!this.selectors.whatsapp) return;
    const phone = '5511999999999';
    const message = encodeURIComponent('Ola! Gostaria de mais informacoes sobre meu projeto.');
    this.selectors.whatsapp.href = `https://wa.me/${phone}?text=${message}`;
  },

  async getProjectsAPI() {
    const stored = localStorage.getItem('conliz_projects');
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  },

  async saveProjectAPI(project) {
    const projects = await this.getProjectsAPI();
    const newProject = { 
      ...project, 
      id: Date.now(), 
      orcamento_total: Number(project.orcamento_total || 0), 
      valor_pago: Number(project.valor_pago || 0),
      status: project.status || 'Planejamento',
      cliente_id: project.cliente_id || this.user.id
    };
    projects.push(newProject);
    localStorage.setItem('conliz_projects', JSON.stringify(projects));
    return newProject;
  },

  getProjects() {
    const stored = localStorage.getItem('conliz_projects');
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  },

  async renderProjects() {
    const list = document.getElementById('projectList');
    if (!list) return;
    let projects = await this.getProjectsAPI();
    if (!Array.isArray(projects)) projects = [];
    const filtered = this.user.cargo === 'admin' ? projects : projects.filter((p) => String(p.cliente_id) === String(this.user.id));
    if (!filtered.length) {
      list.innerHTML = '<p>Nenhum projeto encontrado para este usuario.</p>';
      return;
    }

    list.innerHTML = filtered.map((project) => {
      const pendente = Math.max(0, (project.orcamento_total || 0) - (project.valor_pago || 0));
      const porcent = Math.round(((project.valor_pago || 0) / Math.max(project.orcamento_total || 1, 1)) * 100);
      const clientName = project.cliente_id === this.user.id ? this.user.nome : '�';
      const endereco = project.endereco || '�';
      return `<div class="card-finance" style="padding:1.25rem;"><h4 style="margin:0 0 0.5rem;">${project.nome_obra}</h4><p style="margin:0.15rem 0;"><strong>Cliente:</strong> ${clientName}</p><p style="margin:0.15rem 0;"><strong>Endereco:</strong> ${endereco}</p><p style="margin:0.15rem 0;">Status: <strong>${project.status}</strong></p><p style="margin:0.15rem 0;">Orcamento: <strong>R$ ${(project.orcamento_total || 0).toLocaleString('pt-BR')}</strong></p><p style="margin:0.15rem 0;">Pago: <strong>R$ ${(project.valor_pago || 0).toLocaleString('pt-BR')}</strong></p><p style="margin:0.15rem 0;">Pendente: <strong>R$ ${pendente.toLocaleString('pt-BR')}</strong></p><div class="progress-bar" aria-label="Progresso do projeto"><span style="width: ${porcent}%"></span></div></div>`;
    }).join('');

    const total = filtered.reduce((acc, p) => acc + (p.orcamento_total || 0), 0);
    const paid = filtered.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
    const pending = Math.max(0, total - paid);
    if (document.getElementById('financeTotal')) document.getElementById('financeTotal').textContent = `R$ ${total.toLocaleString('pt-BR')}`;
    if (document.getElementById('financePaid')) document.getElementById('financePaid').textContent = `R$ ${paid.toLocaleString('pt-BR')}`;
    if (document.getElementById('financePending')) document.getElementById('financePending').textContent = `R$ ${pending.toLocaleString('pt-BR')}`;
    this.updateFinanceChart(paid, pending);
  },

  initProjectForm() {}, // Placeholder se desejar implementar form de projetos no futuro
  initFinanceChart() {},
  updateFinanceChart() {},
  initDiary() {},
  getDiaryEntries() { return []; },
  renderDiaryGallery() {},
  readFileAsDataURL(file) { return Promise.resolve(file); },
  initSchedule() {},
  getSchedule() { return []; },
  renderSchedule() {},
  initUserManagement() {},
  renderUserList() {},
  initExportReport() {},
  exportReport() {},

  showToast(message) {
    if (!this.selectors.toast) return;
    this.selectors.toast.textContent = message;
    this.selectors.toast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.selectors.toast.classList.remove('visible'), 4800);
  },
};

Conliz.init();
