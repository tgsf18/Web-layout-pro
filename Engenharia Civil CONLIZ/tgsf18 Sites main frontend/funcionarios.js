/**
 * Conliz Employee Management Module
 * Handles CRUD, Calculations, and UI for Employee Dashboard
 */

const EmployeeApp = {
  data: [],
  storageKey: 'conliz_employees',

  init() {
    this.setupListeners();
    this.loadEmployees();
  },

  setupListeners() {
    // Modal triggers
    document.getElementById('btnAddEmployee').addEventListener('click', () => this.openModal());
    
    // Automatic Calculations
    const salaryMonthly = document.getElementById('salaryMonthly');
    const salaryDaily = document.getElementById('salaryDaily');
    const paymentType = document.getElementById('paymentType');

    salaryMonthly.addEventListener('input', (e) => {
      if (paymentType.value === 'monthly') {
        const val = parseFloat(e.target.value) || 0;
        salaryDaily.value = (val / 22).toFixed(2);
      }
    });

    paymentType.addEventListener('change', (e) => {
      if (e.target.value === 'daily') {
        salaryMonthly.readOnly = true;
        salaryMonthly.value = '';
        salaryDaily.readOnly = false;
        salaryDaily.placeholder = "Valor da diária";
      } else {
        salaryMonthly.readOnly = false;
        salaryDaily.readOnly = true;
        // Recalculate if value exists
        const val = parseFloat(salaryMonthly.value) || 0;
        if(val) salaryDaily.value = (val / 22).toFixed(2);
      }
    });

    // Filters
    ['filterSearch', 'filterSite', 'filterRole', 'filterContract'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.renderTable());
    });

    // Export
    document.getElementById('btnExport').addEventListener('click', () => this.exportPDF());
  },

  // --- API Simulation ---
  async fetchEmployees() {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        const stored = localStorage.getItem(this.storageKey);
        this.data = stored ? JSON.parse(stored) : this.seedData();
        resolve(this.data);
      }, 300);
    });
  },

  async saveToStorage() {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        resolve();
      }, 300);
    });
  },

  seedData() {
    return [
      {
        id: 'emp-001',
        name: 'Carlos Mendes',
        role: 'Mestre de Obra',
        status: 'active',
        site: 'Residencial Alpha',
        contract: { type: 'CLT', start: '2023-01-10', end: null },
        financial: { type: 'monthly', salary_monthly: 4500, salary_daily: 204.54, payment_day: 5 },
        safety: { contact: 'Maria (11) 9999-9999', epis: ['helmet', 'boots'] }
      },
      {
        id: 'emp-002',
        name: 'Roberto Silva',
        role: 'Pedreiro',
        status: 'active',
        site: 'Comercial Centro',
        contract: { type: 'PJ', start: '2023-06-01', end: '2023-12-01' },
        financial: { type: 'daily', salary_monthly: 0, salary_daily: 180, payment_day: 15 },
        safety: { contact: 'Ana (11) 8888-8888', epis: ['helmet', 'boots', 'gloves'] }
      }
    ];
  },

  // --- UI Logic ---
  async loadEmployees() {
    await this.fetchEmployees();
    this.populateSiteFilter();
    this.renderTable();
  },

  populateSiteFilter() {
    const sites = [...new Set(this.data.map(e => e.site).filter(Boolean))];
    const select = document.getElementById('filterSite');
    select.innerHTML = '<option value="all">Todas as Obras</option>' + 
      sites.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  renderTable() {
    const tbody = document.getElementById('employeesTableBody');
    const search = document.getElementById('filterSearch').value.toLowerCase();
    const site = document.getElementById('filterSite').value;
    const role = document.getElementById('filterRole').value;
    const contract = document.getElementById('filterContract').value;

    const filtered = this.data.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search);
      const matchesSite = site === 'all' || emp.site === site;
      const matchesRole = role === 'all' || emp.role === role;
      const matchesContract = contract === 'all' || emp.contract.type === contract;
      return matchesSearch && matchesSite && matchesRole && matchesContract && emp.status !== 'deleted';
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nenhum funcionário encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(emp => {
      const initials = emp.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
      const salaryDisplay = emp.financial.type === 'monthly' 
        ? `R$ ${parseFloat(emp.financial.salary_monthly).toLocaleString('pt-BR')}`
        : `R$ ${parseFloat(emp.financial.salary_daily).toLocaleString('pt-BR')} / dia`;

      // Contract Progress
      let progressHtml = '';
      if (emp.contract.end) {
        const start = new Date(emp.contract.start).getTime();
        const end = new Date(emp.contract.end).getTime();
        const now = new Date().getTime();
        const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        progressHtml = `
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">Término: ${new Date(emp.contract.end).toLocaleDateString('pt-BR')}</div>
          <div class="progress-track" title="${pct.toFixed(0)}% concluído"><div class="progress-fill" style="width: ${pct}%"></div></div>
        `;
      } else {
        progressHtml = `<span style="font-size: 0.75rem; color: var(--success);">Indeterminado</span>`;
      }

      // Status Badge
      const statusClass = emp.status === 'active' ? 'status-badge--active' : 'status-badge--paused';
      const statusLabel = emp.status === 'active' ? 'Ativo' : (emp.status === 'vacation' ? 'Férias' : 'Inativo');

      return `
        <tr>
          <td>
            <div class="avatar-cell">
              <div class="avatar-small">${initials}</div>
              <div>
                <div style="font-weight: 600; color: var(--deep);">${emp.name}</div>
                <div style="font-size: 0.8rem; color: var(--muted);">${emp.site || 'Sem obra'}</div>
              </div>
            </div>
          </td>
          <td>${emp.role}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <div style="font-weight: 600; font-size: 0.9rem;">${emp.contract.type}</div>
            ${progressHtml}
          </td>
          <td class="cell-currency">${salaryDisplay}</td>
          <td>
            <button class="btn-icon" title="Ver Detalhes" onclick="EmployeeApp.viewEmployee('${emp.id}')">👁️</button>
            <button class="btn-icon" title="Editar" onclick="EmployeeApp.editEmployee('${emp.id}')">✏️</button>
            <button class="btn-icon delete" title="Excluir" onclick="EmployeeApp.deleteEmployee('${emp.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // --- CRUD Operations ---
  openModal(employee = null) {
    const form = document.getElementById('employeeForm');
    form.reset();
    document.getElementById('modalTitle').textContent = employee ? 'Editar Funcionário' : 'Novo Funcionário';
    document.getElementById('employeeModal').classList.add('open');
    this.switchTab('dados'); // Reset tab

    if (employee) {
      form.id.value = employee.id;
      form.name.value = employee.name;
      form.role.value = employee.role;
      form.status.value = employee.status;
      form.contract_type.value = employee.contract.type;
      form.site.value = employee.site;
      form.start_date.value = employee.contract.start;
      if(employee.contract.end) form.end_date.value = employee.contract.end;

      form.payment_type.value = employee.financial.type;
      form.payment_day.value = employee.financial.payment_day;
      form.salary_monthly.value = employee.financial.salary_monthly;
      form.salary_daily.value = employee.financial.salary_daily;
      form.productivity_bonus.checked = employee.financial.bonus;

      form.emergency_contact.value = employee.safety.contact;
      // Checkboxes
      const epis = employee.safety.epis || [];
      form.epi_helmet.checked = epis.includes('helmet');
      form.epi_boots.checked = epis.includes('boots');
      form.epi_gloves.checked = epis.includes('gloves');
      form.epi_glasses.checked = epis.includes('glasses');

      // Trigger events to set readOnly states
      form.payment_type.dispatchEvent(new Event('change'));
    } else {
      form.id.value = '';
    }
  },

  closeModal() {
    document.getElementById('employeeModal').classList.remove('open');
  },

  async saveEmployee() {
    const form = document.getElementById('employeeForm');
    const fd = new FormData(form);
    
    // Validation
    if (!fd.get('name') || !fd.get('role')) {
      this.showToast('Preencha os campos obrigatórios (*).');
      return;
    }

    const epis = [];
    if(fd.get('epi_helmet')) epis.push('helmet');
    if(fd.get('epi_boots')) epis.push('boots');
    if(fd.get('epi_gloves')) epis.push('gloves');
    if(fd.get('epi_glasses')) epis.push('glasses');

    const newEmp = {
      id: fd.get('id') || `emp-${Date.now()}`,
      name: fd.get('name'),
      role: fd.get('role'),
      status: fd.get('status'),
      site: fd.get('site'),
      contract: {
        type: fd.get('contract_type'),
        start: fd.get('start_date'),
        end: fd.get('end_date') || null
      },
      financial: {
        type: fd.get('payment_type'),
        payment_day: fd.get('payment_day'),
        salary_monthly: parseFloat(fd.get('salary_monthly')) || 0,
        salary_daily: parseFloat(fd.get('salary_daily')) || 0,
        bonus: fd.get('productivity_bonus') === 'on'
      },
      safety: {
        contact: fd.get('emergency_contact'),
        epis: epis
      }
    };

    const index = this.data.findIndex(e => e.id === newEmp.id);
    if (index >= 0) {
      this.data[index] = newEmp;
      this.showToast('Funcionário atualizado com sucesso!');
    } else {
      this.data.unshift(newEmp);
      this.showToast('Funcionário cadastrado com sucesso!');
    }

    await this.saveToStorage();
    this.closeModal();
    this.loadEmployees();
  },

  editEmployee(id) {
    const emp = this.data.find(e => e.id === id);
    if (emp) this.openModal(emp);
  },

  // --- View Details Operation ---
  viewEmployee(id) {
    const emp = this.data.find(e => e.id === id);
    if (!emp) return;
    
    const modal = document.getElementById('viewEmployeeModal');
    const container = document.getElementById('viewEmployeeBody');
    const btnEdit = document.getElementById('btnEditFromView');
    
    // Formatters
    const fmtMoney = (v) => parseFloat(v).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
    const translateEpi = (epi) => {
      const map = { helmet: 'Capacete', boots: 'Botas', gloves: 'Luvas', glasses: 'Óculos' };
      return map[epi] || epi;
    };

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;">
        <div style="width: 64px; height: 64px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; flex-shrink: 0;">
          ${emp.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
        </div>
        <div>
          <h2 style="margin: 0; font-size: 1.25rem; color: var(--deep);">${emp.name}</h2>
          <div style="margin-top: 4px;">
            <span class="status-badge ${emp.status === 'active' ? 'status-badge--active' : 'status-badge--paused'}">
              ${emp.status === 'active' ? 'Ativo' : (emp.status === 'vacation' ? 'Férias' : 'Inativo')}
            </span>
            <span style="color: var(--muted); font-size: 0.9rem; margin-left: 8px;">${emp.role}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="budget-field"><strong>Obra Atual</strong> <span>${emp.site || 'Não alocado'}</span></div>
        <div class="budget-field"><strong>Tipo de Contrato</strong> <span>${emp.contract.type}</span></div>
        <div class="budget-field"><strong>Início Contrato</strong> <span>${fmtDate(emp.contract.start)}</span></div>
        <div class="budget-field"><strong>Fim Contrato</strong> <span>${fmtDate(emp.contract.end)}</span></div>
      </div>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Financeiro</h4>
      <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="budget-field"><strong>Regime</strong> <span>${emp.financial.type === 'monthly' ? 'Mensalista' : 'Diarista'}</span></div>
        <div class="budget-field"><strong>Dia Pagamento</strong> <span>Dia ${emp.financial.payment_day}</span></div>
        <div class="budget-field"><strong>Salário Base</strong> <span style="font-weight: bold; color: var(--deep);">${emp.financial.type === 'monthly' ? fmtMoney(emp.financial.salary_monthly) : fmtMoney(emp.financial.salary_daily) + '/dia'}</span></div>
        <div class="budget-field"><strong>Bônus Produtividade</strong> <span>${emp.financial.bonus ? 'Sim (Elegível)' : 'Não'}</span></div>
      </div>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Segurança & EPIs</h4>
      <div class="budget-field" style="margin-bottom: 1rem;"><strong>Contato Emergência</strong> <span>${emp.safety.contact || 'Não informado'}</span></div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${(emp.safety.epis || []).map(epi => `<span class="pill" style="margin:0; font-size: 0.8rem;">${translateEpi(epi)}</span>`).join('') || '<span style="color:var(--muted);">Nenhum EPI registrado</span>'}
      </div>
    `;

    btnEdit.onclick = () => {
      this.closeViewModal();
      this.editEmployee(id);
    };

    modal.classList.add('open');
  },

  closeViewModal() {
    document.getElementById('viewEmployeeModal').classList.remove('open');
  },

  async deleteEmployee(id) {
    if (confirm('Tem certeza? O funcionário será marcado como Inativo/Excluído.')) {
      // Soft delete
      const emp = this.data.find(e => e.id === id);
      if (emp) {
        emp.status = 'deleted'; // or just filter it out
        await this.saveToStorage();
        this.showToast('Registro movido para lixeira.');
        this.renderTable();
      }
    }
  },

  // --- Helpers ---
  switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    // Find button logic if needed, simple mapping here:
    const btns = document.querySelectorAll('.tab-btn');
    // rudimentary index matching or text matching
    // For simplicity, just updating visual state on click in HTML
    Array.from(btns).find(b => b.textContent.toLowerCase().includes(tabName.substring(0,4))).classList.add('active');
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3000);
  },

  exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Custo de Mão de Obra Diário", 14, 20);
    
    const tableData = this.data
      .filter(e => e.status === 'active')
      .map(e => [
        e.name, 
        e.role, 
        e.site, 
        (e.financial.type === 'monthly' ? (e.financial.salary_monthly/22).toFixed(2) : e.financial.salary_daily)
      ]);

    doc.autoTable({
      head: [['Nome', 'Cargo', 'Obra', 'Custo/Dia (Est.)']],
      body: tableData,
      startY: 30,
    });

    doc.save(`relatorio-equipe-${new Date().toISOString().slice(0,10)}.pdf`);
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => EmployeeApp.init());