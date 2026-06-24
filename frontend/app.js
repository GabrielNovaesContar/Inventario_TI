const API_URL = "http://localhost:8080/api/v1";
let listaAtivosGlobal = []; 
let listaPecasGlobal = [];
let listaSupsGlobal = [];

// =================== SISTEMA DE TOASTS E CONFIRMAÇÃO ===================
function mostrarToast(msg, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = tipo === 'success' ? 'bg-green-600' : (tipo === 'error' ? 'bg-red-600' : 'bg-blue-600');
    toast.className = `${bg} text-white px-6 py-3 rounded shadow-lg transition-all duration-300 transform translate-y-5 opacity-0 font-bold`;
    toast.innerText = msg;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-y-5', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let acaoConfirmacaoPendente = null;
function pedirConfirmacao(msg, acao) {
    document.getElementById('msg-confirmacao').innerText = msg;
    acaoConfirmacaoPendente = acao;
    document.getElementById('modal-confirmacao').classList.remove('hidden');
}
function fecharConfirmacao() {
    document.getElementById('modal-confirmacao').classList.add('hidden');
    acaoConfirmacaoPendente = null;
}
document.getElementById('btn-confirmar').addEventListener('click', () => {
    if(acaoConfirmacaoPendente) acaoConfirmacaoPendente();
    fecharConfirmacao();
});


// =================== INICIALIZAÇÃO E NAVEGAÇÃO ===================
document.addEventListener("DOMContentLoaded", () => {
    const tokenSalvo = localStorage.getItem("token_ti");
    if (tokenSalvo) mostrarPainel();
    document.getElementById("hist-data").valueAsDate = new Date();
});

async function fazerLogin() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin", password: "123" })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token_ti", data.token); 
            mostrarPainel();
            mostrarToast("Login efetuado com sucesso!", "success");
        } else mostrarToast("Credenciais inválidas!", "error");
    } catch (error) { mostrarToast("Servidor Python offline!", "error"); }
}

function sair() { 
    localStorage.removeItem("token_ti"); 
    localStorage.removeItem("aba_atual"); 
    location.reload(); 
}

function mostrarPainel() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    document.getElementById("app-screen").classList.add("flex");
    
    const abaSalva = localStorage.getItem("aba_atual") || "lista";
    mudarAba(abaSalva);

    carregarAtivos();
    carregarPecas();
    carregarSuprimentos();
}

function mudarAba(aba) {
    ["lista", "pecas", "suprimentos", "dashboard"].forEach(id => {
        document.getElementById(`aba-${id}`).classList.add("hidden");
        document.getElementById(`btn-aba-${id}`).classList.remove("bg-slate-800");
    });
    
    document.getElementById(`aba-${aba}`).classList.remove("hidden");
    document.getElementById(`btn-aba-${aba}`).classList.add("bg-slate-800");
    localStorage.setItem("aba_atual", aba);

    if(aba === 'dashboard') atualizarDashboard();
}

// =================== ATIVOS (EQUIPAMENTOS) ===================
async function carregarAtivos() {
    const response = await fetch(`${API_URL}/assets`);
    listaAtivosGlobal = await response.json();
    
    // O erro estava aqui! Removemos as referências aos IDs antigos que quebravam a tela.
    aplicarFiltros(); 
}

function aplicarFiltros() {
    const cat = document.getElementById("filtro-categoria").value;
    const stat = document.getElementById("filtro-status").value;
    const set = document.getElementById("filtro-setor").value;

    const filtrados = listaAtivosGlobal.filter(a => 
        (cat === "" || a.category === cat) && 
        (stat === "" || a.status === stat) && 
        (set === "" || a.sector === set)
    );
    desenharTabelaAtivos(filtrados);
}

function desenharTabelaAtivos(ativos) {
    const tbody = document.getElementById("tabela-ativos");
    tbody.innerHTML = ""; 
    
    ativos.forEach(ativo => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50";
        const ativoJSON = encodeURIComponent(JSON.stringify(ativo));

        let statusColor = ativo.status === 'IN_STOCK' ? 'bg-green-100 text-green-800' : 
                          ativo.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
        let statusLabel = ativo.status === 'IN_STOCK' ? 'Estoque' : 
                          ativo.status === 'IN_USE' ? 'Em Uso' : 'Manutenção';

        tr.innerHTML = `
            <td class="p-4">
                <div class="font-mono text-sm text-slate-800 font-bold">${ativo.patrimony}</div>
                <div class="text-xs text-slate-500 mt-1">S/N: ${ativo.serial_number || 'N/A'}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-slate-800">${ativo.name}</div>
                <div class="text-xs text-slate-500 truncate w-48" title="${ativo.specs || ''}">${ativo.specs || '-'}</div>
            </td>
            <td class="p-4 text-sm text-slate-600">${ativo.category.replace("_", " ")}</td>
            <td class="p-4">
                <div class="font-semibold text-slate-700">${ativo.sector.replace("_", " ")}</div>
                <div class="text-xs text-slate-500 mt-1">${ativo.responsible || 'Sem Resp.'}</div>
            </td>
            <td class="p-4"><span class="${statusColor} px-2 py-1 rounded text-xs font-bold">${statusLabel}</span></td>
            <td class="p-4 text-right">
                <button onclick="abrirModalHistorico('${ativo.id}', '${ativo.patrimony}', '${ativo.name}')" class="text-slate-600 hover:text-slate-900 mr-3 font-semibold bg-slate-200 px-2 py-1 rounded text-xs">Histórico</button>
                <button onclick="abrirModalEdicao('${ativoJSON}')" class="text-blue-600 hover:text-blue-800 mr-3 font-semibold text-sm">Editar</button>
                <button onclick="pedirConfirmacao('Deseja excluir este equipamento? Todo o histórico dele será perdido.', () => deletarAtivo('${ativo.id}'))" class="text-red-600 hover:text-red-800 font-semibold text-sm">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleSpecs() {
    const cat = document.getElementById("ativo-categoria").value;
    const divSpecs = document.getElementById("div-specs");
    if(cat === "COMPUTADOR" || cat === "NOTEBOOK") divSpecs.classList.remove("hidden");
    else { divSpecs.classList.add("hidden"); document.getElementById("ativo-specs").value = ""; }
}

async function salvarAtivo() {
    const id = document.getElementById("ativo-id").value;
    const ativo = {
        name: document.getElementById("ativo-nome").value,
        patrimony: document.getElementById("ativo-patrimonio").value,
        serial_number: document.getElementById("ativo-sn").value,
        status: document.getElementById("ativo-status").value,
        category: document.getElementById("ativo-categoria").value,
        sector: document.getElementById("ativo-setor").value,
        specs: document.getElementById("ativo-specs").value,
        responsible: document.getElementById("ativo-responsavel").value
    };

    if(!ativo.name || !ativo.patrimony) {
        mostrarToast("Preencha Nome e Patrimônio!", "error");
        return;
    }

    await fetch(id ? `${API_URL}/assets/${id}` : `${API_URL}/assets`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ativo)
    });

    mostrarToast("Equipamento salvo com sucesso!");
    fecharModal(); 
    carregarAtivos(); 
}

async function deletarAtivo(id) {
    await fetch(`${API_URL}/assets/${id}`, { method: "DELETE" });
    mostrarToast("Equipamento excluído com sucesso!", "success");
    carregarAtivos();
}

function abrirModalNovo() {
    document.getElementById("modal-titulo").innerText = "Novo Equipamento";
    document.getElementById("ativo-id").value = "";
    document.getElementById("ativo-nome").value = "";
    document.getElementById("ativo-patrimonio").value = "";
    document.getElementById("ativo-sn").value = "";
    document.getElementById("ativo-categoria").value = "COMPUTADOR";
    document.getElementById("ativo-status").value = "IN_STOCK";
    document.getElementById("ativo-setor").value = "TI";
    document.getElementById("ativo-specs").value = "";
    document.getElementById("ativo-responsavel").value = "";
    toggleSpecs();
    document.getElementById("modal-ativo").classList.remove("hidden");
}

function abrirModalEdicao(ativoJSONEncoded) {
    const ativo = JSON.parse(decodeURIComponent(ativoJSONEncoded));
    document.getElementById("modal-titulo").innerText = "Editar Equipamento";
    document.getElementById("ativo-id").value = ativo.id;
    document.getElementById("ativo-nome").value = ativo.name;
    document.getElementById("ativo-patrimonio").value = ativo.patrimony;
    document.getElementById("ativo-sn").value = ativo.serial_number || "";
    document.getElementById("ativo-categoria").value = ativo.category;
    document.getElementById("ativo-status").value = ativo.status;
    document.getElementById("ativo-setor").value = ativo.sector;
    document.getElementById("ativo-specs").value = ativo.specs || "";
    document.getElementById("ativo-responsavel").value = ativo.responsible || "";
    toggleSpecs();
    document.getElementById("modal-ativo").classList.remove("hidden");
}

function fecharModal() { document.getElementById("modal-ativo").classList.add("hidden"); }

// =================== HISTÓRICO ===================
function abrirModalHistorico(id, pat, name) {
    document.getElementById("historico-ativo-id").value = id;
    document.getElementById("historico-titulo-ativo").innerText = `${pat} - ${name}`;
    document.getElementById("modal-historico").classList.remove("hidden");
    carregarHistorico(id);
}
function fecharModalHistorico() { document.getElementById("modal-historico").classList.add("hidden"); }

async function carregarHistorico(assetId) {
    const res = await fetch(`${API_URL}/assets/${assetId}/history`);
    const hist = await res.json();
    const tbody = document.getElementById("tabela-historico");
    tbody.innerHTML = "";
    if(hist.length === 0) return tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Nenhum registro.</td></tr>`;

    hist.forEach(reg => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="p-2 font-mono text-slate-500">${new Date(reg.date).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</td>
                        <td class="p-2 font-semibold">${reg.action}</td>
                        <td class="p-2 text-slate-600">${reg.user}</td>
                        <td class="p-2 text-right"><button onclick="pedirConfirmacao('Excluir esta linha do histórico?', () => deletarHistorico('${reg.id}', '${assetId}'))" class="text-red-500 hover:text-red-700 font-bold" title="Remover">X</button></td>`;
        tbody.appendChild(tr);
    });
}

async function salvarHistorico() {
    const assetId = document.getElementById("historico-ativo-id").value;
    const body = { date: document.getElementById("hist-data").value, user: document.getElementById("hist-user").value, action: document.getElementById("hist-acao").value };
    
    if(!body.date || !body.user || !body.action) {
        mostrarToast("Preencha todos os campos do histórico!", "error");
        return;
    }
    await fetch(`${API_URL}/assets/${assetId}/history`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    mostrarToast("Histórico registrado!", "success");
    document.getElementById("hist-acao").value = "";
    carregarHistorico(assetId);
}

async function deletarHistorico(histId, assetId) {
    await fetch(`${API_URL}/history/${histId}`, { method: "DELETE" });
    mostrarToast("Registro apagado.", "success");
    carregarHistorico(assetId);
}

// =================== ESTOQUE DE PEÇAS ===================
async function carregarPecas() {
    const res = await fetch(`${API_URL}/parts`);
    listaPecasGlobal = await res.json();
    aplicarFiltroPecas();
}

function aplicarFiltroPecas() {
    const termo = document.getElementById("filtro-busca-peca").value.toLowerCase();
    const filtrados = listaPecasGlobal.filter(p => p.name.toLowerCase().includes(termo) || p.brand.toLowerCase().includes(termo));
    
    const tbody = document.getElementById("tabela-pecas");
    tbody.innerHTML = "";
    filtrados.forEach(p => {
        const pJSON = encodeURIComponent(JSON.stringify(p));
        tbody.innerHTML += `<tr class="hover:bg-slate-50 border-b">
            <td class="p-4 font-bold text-slate-800">${p.name}</td>
            <td class="p-4 text-sm text-slate-600">${p.brand}</td>
            <td class="p-4 text-center">
                <button onclick="alterarEstoquePeca('${pJSON}', -1)" class="bg-red-100 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-200 transition">-</button>
                <span class="mx-3 font-mono font-bold text-lg">${p.quantity}</span>
                <button onclick="alterarEstoquePeca('${pJSON}', 1)" class="bg-green-100 text-green-700 px-3 py-1 rounded font-bold hover:bg-green-200 transition">+</button>
            </td>
            <td class="p-4 text-right">
                <button onclick="abrirModalPecaEdicao('${pJSON}')" class="text-indigo-600 font-semibold text-sm hover:text-indigo-800 mr-3">Editar</button>
                <button onclick="pedirConfirmacao('Deseja excluir esta peça do sistema?', () => deletarPeca('${p.id}'))" class="text-red-600 font-semibold text-sm hover:text-red-800">Excluir</button>
            </td>
        </tr>`;
    });
}

function abrirModalPeca() {
    document.getElementById("modal-titulo-peca").innerText = "Registrar Peça";
    document.getElementById("peca-id").value = "";
    document.getElementById("peca-nome").value = "";
    document.getElementById("peca-marca").value = "";
    document.getElementById("peca-qtd").value = "1";
    document.getElementById("modal-peca").classList.remove("hidden"); 
}

function abrirModalPecaEdicao(pJSON) {
    const p = JSON.parse(decodeURIComponent(pJSON));
    document.getElementById("modal-titulo-peca").innerText = "Editar Peça";
    document.getElementById("peca-id").value = p.id;
    document.getElementById("peca-nome").value = p.name;
    document.getElementById("peca-marca").value = p.brand;
    document.getElementById("peca-qtd").value = p.quantity;
    document.getElementById("modal-peca").classList.remove("hidden"); 
}

function fecharModalPeca() { document.getElementById("modal-peca").classList.add("hidden"); }

async function salvarPeca() {
    const id = document.getElementById("peca-id").value;
    const b = { name: document.getElementById("peca-nome").value, brand: document.getElementById("peca-marca").value, quantity: parseInt(document.getElementById("peca-qtd").value) };
    if(!b.name) return mostrarToast("Preencha o nome do componente!", "error");
    
    await fetch(id ? `${API_URL}/parts/${id}` : `${API_URL}/parts`, { 
        method: id ? "PUT" : "POST", 
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) 
    });
    mostrarToast("Peça salva com sucesso!");
    fecharModalPeca(); carregarPecas();
}

async function deletarPeca(id) {
    await fetch(`${API_URL}/parts/${id}`, { method: "DELETE" });
    mostrarToast("Peça excluída.", "success");
    carregarPecas();
}

async function alterarEstoquePeca(pJSON, modifier) {
    const p = JSON.parse(decodeURIComponent(pJSON));
    p.quantity += modifier;
    if(p.quantity < 0) return; 
    await fetch(`${API_URL}/parts/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    carregarPecas();
}

// =================== TONERS E DRUMS ===================
async function carregarSuprimentos() {
    const res = await fetch(`${API_URL}/supplies`);
    listaSupsGlobal = await res.json();
    aplicarFiltroSuprimentos();
}

function aplicarFiltroSuprimentos() {
    const tipo = document.getElementById("filtro-tipo-sup").value;
    const termo = document.getElementById("filtro-busca-sup").value.toUpperCase();

    const filtrados = listaSupsGlobal.filter(s => 
        (tipo === "" || s.type === tipo) && s.model.includes(termo)
    );
    
    const tbody = document.getElementById("tabela-suprimentos");
    tbody.innerHTML = "";
    filtrados.forEach(s => {
        let cor = s.type === "TONER" ? "text-emerald-700 bg-emerald-100" : "text-purple-700 bg-purple-100";
        const sJSON = encodeURIComponent(JSON.stringify(s));
        tbody.innerHTML += `<tr class="hover:bg-slate-50 border-b">
            <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${cor}">${s.type}</span></td>
            <td class="p-3 font-bold text-slate-800">${s.model}</td>
            <td class="p-3 text-center">
                <button onclick="alterarEstoqueSup('${sJSON}', -1)" class="bg-red-100 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-200 transition">-</button>
                <span class="mx-2 font-mono font-bold">${s.quantity}</span>
                <button onclick="alterarEstoqueSup('${sJSON}', 1)" class="bg-green-100 text-green-700 px-3 py-1 rounded font-bold hover:bg-green-200 transition">+</button>
            </td>
            <td class="p-3 text-right">
                <button onclick="abrirModalSupEdicao('${sJSON}')" class="text-blue-600 font-semibold text-sm hover:text-blue-800 mr-3">Editar</button>
                <button onclick="pedirConfirmacao('Excluir este suprimento?', () => deletarSup('${s.id}'))" class="text-red-500 font-semibold text-sm hover:text-red-800">Excluir</button>
            </td>
        </tr>`;
    });
}

function abrirModalSuprimento() { 
    document.getElementById("modal-titulo-sup").innerText = "Entrada de Suprimento";
    document.getElementById("sup-id").value = "";
    document.getElementById("sup-modelo").value = "";
    document.getElementById("sup-qtd").value = "1";
    document.getElementById("modal-suprimento").classList.remove("hidden"); 
}

function abrirModalSupEdicao(sJSON) {
    const s = JSON.parse(decodeURIComponent(sJSON));
    document.getElementById("modal-titulo-sup").innerText = "Editar Suprimento";
    document.getElementById("sup-id").value = s.id;
    document.getElementById("sup-tipo").value = s.type;
    document.getElementById("sup-modelo").value = s.model;
    document.getElementById("sup-qtd").value = s.quantity;
    document.getElementById("modal-suprimento").classList.remove("hidden"); 
}

function fecharModalSup() { document.getElementById("modal-suprimento").classList.add("hidden"); }

async function salvarSuprimento() {
    const id = document.getElementById("sup-id").value;
    const b = { type: document.getElementById("sup-tipo").value, model: document.getElementById("sup-modelo").value.toUpperCase(), quantity: parseInt(document.getElementById("sup-qtd").value) };
    if(!b.model) return mostrarToast("Preencha o modelo do suprimento!", "error");
    
    await fetch(id ? `${API_URL}/supplies/${id}` : `${API_URL}/supplies`, { 
        method: id ? "PUT" : "POST", 
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) 
    });
    mostrarToast("Suprimento salvo com sucesso!");
    fecharModalSup(); carregarSuprimentos();
}

async function deletarSup(id) {
    await fetch(`${API_URL}/supplies/${id}`, { method: "DELETE" });
    mostrarToast("Suprimento excluído.", "success");
    carregarSuprimentos();
}

async function alterarEstoqueSup(sJSON, modifier) {
    const s = JSON.parse(decodeURIComponent(sJSON));
    s.quantity += modifier;
    if(s.quantity < 0) return; 
    await fetch(`${API_URL}/supplies/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    carregarSuprimentos();
}

// =================== INTELIGÊNCIA DO DASHBOARD ===================
let chartCategoriaObj = null;
let chartSetorObj = null;

function atualizarDashboard() {
    document.getElementById("dash-kpi-total").innerText = listaAtivosGlobal.length;
    
    const manutencaoCount = listaAtivosGlobal.filter(a => a.status === 'MAINTENANCE').length;
    document.getElementById("dash-kpi-manutencao").innerText = manutencaoCount;
    
    const pecasCount = listaPecasGlobal.reduce((acc, p) => acc + p.quantity, 0);
    document.getElementById("dash-kpi-pecas").innerText = pecasCount;
    
    const tonersBaixaCount = listaSupsGlobal.filter(s => s.quantity < 3).length;
    document.getElementById("dash-kpi-toner-alerta").innerText = tonersBaixaCount;

    if (listaAtivosGlobal.length === 0) return;

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

    const countCategoria = {};
    listaAtivosGlobal.forEach(a => {
        const cat = a.category.replace("_", " ");
        countCategoria[cat] = (countCategoria[cat] || 0) + 1;
    });

    const countSetor = {};
    listaAtivosGlobal.forEach(a => {
        const setor = a.sector.replace("_", " ");
        countSetor[setor] = (countSetor[setor] || 0) + 1;
    });

    const ctxCat = document.getElementById('graficoCategorias').getContext('2d');
    if(chartCategoriaObj) chartCategoriaObj.destroy();
    
    chartCategoriaObj = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(countCategoria),
            datasets: [{
                data: Object.values(countCategoria),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'],
                borderWidth: 0, hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: {size: 11} } } }, cutout: '70%' }
    });

    const ctxSetor = document.getElementById('graficoSetores').getContext('2d');
    if(chartSetorObj) chartSetorObj.destroy();
    const setoresOrdenados = Object.entries(countSetor).sort((a, b) => b[1] - a[1]);

    chartSetorObj = new Chart(ctxSetor, {
        type: 'bar',
        data: {
            labels: setoresOrdenados.map(i => i[0]),
            datasets: [{ label: 'Equipamentos', data: setoresOrdenados.map(i => i[1]), backgroundColor: '#3b82f6', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
    });
}