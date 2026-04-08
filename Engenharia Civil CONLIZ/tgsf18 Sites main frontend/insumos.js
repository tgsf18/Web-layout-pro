const STORAGE_KEY = 'insumos';

let insumos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let costChart = null; // Variável para o gráfico Chart.js

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(insumos));
  updateTotals();
}

function addRow() {
  insumos.push({ id: Date.now(), nome: '', qtd: 1, preco: 0 });
  save();
  render();
}

function deleteRow(id) {
  insumos = insumos.filter(i => i.id !== id);
  save();
  render();
}

function updateValue(id, field, value) {
  const item = insumos.find(i => i.id === id);
  item[field] = field === 'nome' ? value : parseFloat(value) || 0;
  save();
}

function updateTotals() {
  let total = 0;

  insumos.forEach(i => {
    total += i.qtd * i.preco;

    const el = document.getElementById(`total-${i.id}`);
    if (el) {
      el.innerText = (i.qtd * i.preco).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
  });

  document.getElementById('grandTotal').innerText =
    total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
  updateChart(); // Atualiza o gráfico sempre que os totais mudam
}

function render(filter = '') {
  const body = document.getElementById('insumosBody');
  if (!body) return;
  
  body.innerHTML = '';

  if (insumos.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 3rem 1rem; color: #64748b;">
          <div style="margin-bottom: 0.5rem; font-size: 1.5rem; opacity: 0.5;">📝</div>
          Nenhum item lançado.<br>Clique em <strong>+ Adicionar Item</strong> para começar seu orçamento.
        </td>
      </tr>`;
  }

  insumos.forEach(item => {
    if (filter && !item.nome.toLowerCase().includes(filter)) return;

    body.innerHTML += `
      <tr>
        <td><input class="table-input" type="text" placeholder="Nome do item" value="${item.nome}" oninput="updateValue(${item.id}, 'nome', this.value)"></td>
        <td><input class="table-input" type="number" placeholder="0" value="${item.qtd}" oninput="updateValue(${item.id}, 'qtd', this.value)"></td>
        <td><input class="table-input" type="number" placeholder="0.00" value="${item.preco}" step="0.01" oninput="updateValue(${item.id}, 'preco', this.value)"></td>
        <td class="cell-currency" id="total-${item.id}">R$ 0,00</td>
        <td class="text-center"><button class="btn-delete" title="Remover item" onclick="deleteRow(${item.id})" aria-label="Excluir item">&times;</button></td>
      </tr>
    `;
  });

  updateTotals();
}

function filterTable() {
  const term = document.getElementById('tableSearch').value.toLowerCase();
  render(term);
}

function clearAll() {
  if (confirm('Limpar tudo?')) {
    insumos = [];
    save();
    render();
  }
}

function exportCSV() {
  if (insumos.length === 0) {
    alert('A tabela está vazia. Adicione itens antes de exportar.');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Item,Quantidade,Preço Unitário,Total\n";

  insumos.forEach(item => {
    const total = (item.qtd * item.preco).toFixed(2);
    // Escapa aspas duplas no nome e envolve em aspas para CSV válido
    const safeName = item.nome.replace(/"/g, '""');
    const row = `"${safeName}",${item.qtd},${item.preco},${total}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `insumos_conliz_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Inicializa o gráfico se a biblioteca Chart.js estiver carregada
function initChart() {
  const ctx = document.getElementById('costChart');
  if (!ctx || typeof Chart === 'undefined') return;

  // Se já existir, destrói para recriar (evita bugs de canvas)
  if (costChart) costChart.destroy();

  costChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
  updateChart();
}

function updateChart() {
  if (!costChart) return;
  costChart.data.labels = insumos.map(i => i.nome || 'Item sem nome');
  costChart.data.datasets[0].data = insumos.map(i => i.qtd * i.preco);
  costChart.update();
}

// Tenta iniciar o gráfico ao carregar
if (typeof Chart !== 'undefined') initChart();
render();