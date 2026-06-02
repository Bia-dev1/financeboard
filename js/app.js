const API_URL = 'https://financeboard-0wgo.onrender.com/api';

const elSaldo        = document.getElementById('valor-saldo');
const elEntradas     = document.getElementById('valor-entradas');
const elSaidas       = document.getElementById('valor-saidas');
const elTbody        = document.getElementById('tabela-corpo');
const elContador     = document.getElementById('tabela-contador');
const elFeedback     = document.getElementById('form-feedback');
const elLoading      = document.getElementById('loading-overlay');
const elHeaderDate   = document.getElementById('header-date');

let graficoPizza = null;
let graficoLinha = null;

const CORES_CATEGORIAS = [
  '#4f6ef7', 
  '#f05c6e', 
  '#22c97a', 
  '#f0a030', 
  '#9b6af7', 
  '#26c6da', 
  '#f7934c', 
  '#a0aec0', 
];

const CORES_BADGE = {
  'Alimentação':    { bg: 'rgba(240,160,48,0.12)',   cor: '#f0a030' },
  'Transporte':     { bg: 'rgba(79,110,247,0.12)',    cor: '#4f6ef7' },
  'Moradia':        { bg: 'rgba(155,106,247,0.12)',   cor: '#9b6af7' },
  'Saúde':          { bg: 'rgba(34,201,122,0.12)',    cor: '#22c97a' },
  'Educação':       { bg: 'rgba(38,198,218,0.12)',    cor: '#26c6da' },
  'Lazer':          { bg: 'rgba(247,147,76,0.12)',    cor: '#f7934c' },
  'Salário':        { bg: 'rgba(34,201,122,0.12)',    cor: '#22c97a' },
  'Freelance':      { bg: 'rgba(79,110,247,0.12)',    cor: '#4f6ef7' },
  'Investimentos':  { bg: 'rgba(155,106,247,0.12)',   cor: '#9b6af7' },
  'Outros':         { bg: 'rgba(160,174,192,0.12)',   cor: '#a0aec0' },
};


document.addEventListener('DOMContentLoaded', async () => {
 
  elHeaderDate.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  document.getElementById('campo-data').value = dataHoje();

  await carregarDados();

  elLoading.classList.add('oculto');
  setTimeout(() => elLoading.remove(), 400);
});


async function carregarDados() {
  try {
    const [resResumo, resTransacoes] = await Promise.all([
      fetch(`${API_URL}/resumo`),
      fetch(`${API_URL}/transacoes`)
    ]);

    const resumo = await resResumo.json();
    const transacoes = await resTransacoes.json();

    atualizarCards(resumo);
    atualizarGraficoPizza(resumo.por_categoria);
    atualizarGraficoLinha(resumo.historico_diario);
    renderizarTabela(transacoes);

  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
    mostrarFeedback('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 'erro');
  }
}


function atualizarCards(resumo) {
  elSaldo.textContent    = formatarMoeda(resumo.saldo);
  elEntradas.textContent = formatarMoeda(resumo.total_entradas);
  elSaidas.textContent   = formatarMoeda(resumo.total_saidas);

  const cardSaldo = document.querySelector('.card-saldo .card-value');
  if (resumo.saldo < 0) {
    cardSaldo.style.color = 'var(--red)';
  } else {
    cardSaldo.style.color = 'var(--blue)';
  }
}


function atualizarGraficoPizza(porCategoria) {
  const canvas = document.getElementById('grafico-pizza');
  const wrapperVazio = document.getElementById('pizza-vazio');

  if (!porCategoria || porCategoria.length === 0) {
    canvas.style.display = 'none';
    wrapperVazio.style.display = 'flex';
    document.getElementById('legenda-pizza').innerHTML = '';
    return;
  }

  canvas.style.display = 'block';
  wrapperVazio.style.display = 'none';

  if (graficoPizza) graficoPizza.destroy();

  const labels = porCategoria.map(c => c.categoria);
  const valores = porCategoria.map(c => c.total);
  const cores = labels.map((_, i) => CORES_CATEGORIAS[i % CORES_CATEGORIAS.length]);

  graficoPizza = new Chart(canvas, {
    type: 'doughnut',   
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: cores,
        borderColor: '#1a1f2e',   
        borderWidth: 3,
        hoverBorderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',   
      plugins: {
        legend: { display: false },   
        tooltip: {
          backgroundColor: '#1a1f2e',
          titleColor: '#7a8299',
          bodyColor: '#e8eaf0',
          borderColor: '#2a3045',
          borderWidth: 1,
          callbacks: {
            label: ctx => `  ${formatarMoeda(ctx.raw)}`
          }
        }
      }
    }
  });

  const legenda = document.getElementById('legenda-pizza');
  legenda.innerHTML = porCategoria.map((c, i) => `
    <div class="legend-item">
      <span class="legend-label">
        <span class="legend-dot" style="background:${cores[i]}"></span>
        ${c.categoria}
      </span>
      <span class="legend-value">${formatarMoeda(c.total)}</span>
    </div>
  `).join('');
}


function atualizarGraficoLinha(historicoDiario) {
  const canvas = document.getElementById('grafico-linha');
  const wrapperVazio = document.getElementById('linha-vazio');

  if (!historicoDiario || historicoDiario.length === 0) {
    canvas.style.display = 'none';
    wrapperVazio.style.display = 'flex';
    return;
  }

  canvas.style.display = 'block';
  wrapperVazio.style.display = 'none';

  if (graficoLinha) graficoLinha.destroy();

  const labels = historicoDiario.map(d => {
    const [ano, mes, dia] = d.data.split('-');
    return `${dia}/${mes}`;
  });

  const saldos = historicoDiario.map(d => d.saldo);

  const ultimoSaldo = saldos[saldos.length - 1];
  const corLinha = ultimoSaldo >= 0 ? '#4f6ef7' : '#f05c6e';

  graficoLinha = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Saldo acumulado',
        data: saldos,
        borderColor: corLinha,
        backgroundColor: ultimoSaldo >= 0
          ? 'rgba(79, 110, 247, 0.08)'
          : 'rgba(240, 92, 110, 0.08)',
        borderWidth: 2.5,
        pointRadius: saldos.length > 15 ? 0 : 4,   
        pointHoverRadius: 6,
        pointBackgroundColor: corLinha,
        fill: true,
        tension: 0.4,  
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1f2e',
          titleColor: '#7a8299',
          bodyColor: '#e8eaf0',
          borderColor: '#2a3045',
          borderWidth: 1,
          callbacks: {
            label: ctx => `  Saldo: ${formatarMoeda(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a5270', font: { size: 11 }, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#4a5270',
            font: { size: 11 },
            callback: v => `R$ ${v.toLocaleString('pt-BR')}`
          }
        }
      }
    }
  });
}

function renderizarTabela(transacoes) {
  elContador.textContent = `${transacoes.length} registro${transacoes.length !== 1 ? 's' : ''}`;

  if (transacoes.length === 0) {
    elTbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabela-vazia">
          <span class="tabela-vazia-icon">📋</span>
          Nenhuma transação registrada ainda.<br>
          Use o formulário acima para adicionar a primeira.
        </td>
      </tr>
    `;
    return;
  }

  elTbody.innerHTML = transacoes.map(t => {
    const isEntrada = t.tipo === 'entrada';
    const badgeCor = CORES_BADGE[t.categoria] || CORES_BADGE['Outros'];

    const [ano, mes, dia] = t.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return `
      <tr id="linha-${t.id}">
        <td class="td-descricao">${t.descricao}</td>
        <td>
          <span class="badge-tipo ${isEntrada ? 'badge-entrada' : 'badge-saida'}">
            ${isEntrada ? '↑' : '↓'} ${isEntrada ? 'Entrada' : 'Saída'}
          </span>
        </td>
        <td>
          <span class="badge-categoria"
            style="background:${badgeCor.bg}; color:${badgeCor.cor}">
            ${t.categoria}
          </span>
        </td>
        <td class="td-valor ${isEntrada ? 'valor-entrada' : 'valor-saida'}">
          ${isEntrada ? '+' : '-'} ${formatarMoeda(t.valor)}
        </td>
        <td style="color: var(--text-secondary); font-size: 13px">${dataFormatada}</td>
        <td>
          <button class="btn-deletar" onclick="deletarTransacao(${t.id}, '${t.descricao}')">
            ✕ Remover
          </button>
        </td>
      </tr>
    `;
  }).join('');
}


document.getElementById('form-transacao').addEventListener('submit', async (e) => {
  e.preventDefault();   

  const btn = e.target.querySelector('.btn-submit');
  const descricao  = document.getElementById('campo-descricao').value.trim();
  const valor      = document.getElementById('campo-valor').value;
  const tipo       = document.getElementById('campo-tipo').value;
  const categoria  = document.getElementById('campo-categoria').value;
  const data       = document.getElementById('campo-data').value;

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const resposta = await fetch(`${API_URL}/transacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao, valor: parseFloat(valor), tipo, categoria, data })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao salvar');
    }

    mostrarFeedback(`✓ "${descricao}" adicionado com sucesso!`, 'sucesso');
    e.target.reset();
    document.getElementById('campo-data').value = dataHoje();
    await carregarDados();   

  } catch (erro) {
    mostrarFeedback(`Erro: ${erro.message}`, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Adicionar';
  }
});


async function deletarTransacao(id, descricao) {
  if (!confirm(`Remover "${descricao}"?`)) return;

  try {
    const resposta = await fetch(`${API_URL}/transacoes/${id}`, {
      method: 'DELETE'
    });

    if (!resposta.ok) throw new Error('Erro ao remover');

    mostrarFeedback(`"${descricao}" removido.`, 'sucesso');
    await carregarDados();   

  } catch (erro) {
    mostrarFeedback('Erro ao remover transação.', 'erro');
  }
}


function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function dataHoje() {
  return new Date().toISOString().split('T')[0];
}

function mostrarFeedback(mensagem, tipo) {
  elFeedback.textContent = mensagem;
  elFeedback.className = `form-feedback ${tipo}`;

  
  clearTimeout(elFeedback._timeout);
  elFeedback._timeout = setTimeout(() => {
    elFeedback.className = 'form-feedback';   
  }, 4000);
}
