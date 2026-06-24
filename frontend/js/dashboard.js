let chartCategoriaObj = null;
let chartSetorObj = null;

function atualizarDashboard() {
    // 1. Atualiza os KPIs Principais
    document.getElementById("dash-kpi-total").innerText = listaAtivosGlobal.length;
    
    const manutencaoCount = listaAtivosGlobal.filter(a => a.status === 'MAINTENANCE').length;
    document.getElementById("dash-kpi-manutencao").innerText = manutencaoCount;
    
    const pecasCount = listaPecasGlobal.reduce((acc, p) => acc + p.quantity, 0);
    document.getElementById("dash-kpi-pecas").innerText = pecasCount;
    
    const tonersBaixaCount = listaSupsGlobal.filter(s => s.quantity < 3).length;
    document.getElementById("dash-kpi-toner-alerta").innerText = tonersBaixaCount;

    // Se o banco estiver vazio, encerra aqui para não quebrar a matemática
    if (listaAtivosGlobal.length === 0) return;

    // 2. Atualiza as Barras de Progresso
    const emUso = listaAtivosGlobal.filter(a => a.status === 'IN_USE').length;
    const estoque = listaAtivosGlobal.filter(a => a.status === 'IN_STOCK').length;
    const total = listaAtivosGlobal.length;

    const pctUso = ((emUso / total) * 100).toFixed(0);
    const pctEstoque = ((estoque / total) * 100).toFixed(0);
    const pctManut = ((manutencaoCount / total) * 100).toFixed(0);

    document.getElementById("barra-uso-txt").innerText = `${pctUso}%`;
    document.getElementById("barra-uso-fill").style.width = `${pctUso}%`;
    document.getElementById("barra-estoque-txt").innerText = `${pctEstoque}%`;
    document.getElementById("barra-estoque-fill").style.width = `${pctEstoque}%`;
    document.getElementById("barra-manut-txt").innerText = `${pctManut}%`;
    document.getElementById("barra-manut-fill").style.width = `${pctManut}%`;

    // 3. Monta os Gráficos
    const countCategoria = {};
    const countSetor = {};
    listaAtivosGlobal.forEach(a => {
        countCategoria[a.category.replace("_", " ")] = (countCategoria[a.category.replace("_", " ")] || 0) + 1;
        countSetor[a.sector.replace("_", " ")] = (countSetor[a.sector.replace("_", " ")] || 0) + 1;
    });

    const ctxCat = document.getElementById('graficoCategorias').getContext('2d');
    if(chartCategoriaObj) chartCategoriaObj.destroy();
    chartCategoriaObj = new Chart(ctxCat, {
        type: 'doughnut', 
        data: { labels: Object.keys(countCategoria), datasets: [{ data: Object.values(countCategoria), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
    });

    const ctxSetor = document.getElementById('graficoSetores').getContext('2d');
    if(chartSetorObj) chartSetorObj.destroy();
    const setoresOrd = Object.entries(countSetor).sort((a, b) => b[1] - a[1]);
    chartSetorObj = new Chart(ctxSetor, {
        type: 'bar', 
        data: { labels: setoresOrd.map(i => i[0]), datasets: [{ label: 'Equipamentos', data: setoresOrd.map(i => i[1]), backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
    });
}