// =================================================================
// FUNÇÃO AJUDANTE: Pega o crachá (Token) da memória do navegador
// =================================================================
function getAuthHeaders() {
    const token = localStorage.getItem("token_ti");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // O espaço depois do Bearer é obrigatório!
    };
}

// =================== ATIVOS (EQUIPAMENTOS) ===================
async function carregarAtivos() {
    const response = await fetch(`${API_URL}/assets`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    // Se o Python retornar 401, significa que o token é inválido ou venceu
    if (response.status === 401) {
        mostrarToast("Sessão expirada. Faça login novamente.", "error");
        return sair(); // Função que está no auth.js para deslogar
    }

    listaAtivosGlobal = await response.json();
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
        headers: getAuthHeaders(), // <--- Crachá embutido aqui!
        body: JSON.stringify(ativo)
    });

    mostrarToast("Equipamento salvo com sucesso!");
    fecharModal(); 
    carregarAtivos(); 
}

async function deletarAtivo(id) {
    await fetch(`${API_URL}/assets/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders() // <--- Crachá embutido aqui!
    });
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
    const res = await fetch(`${API_URL}/assets/${assetId}/history`, {
        headers: getAuthHeaders() // <--- Crachá embutido aqui!
    });
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
    await fetch(`${API_URL}/assets/${assetId}/history`, { 
        method: "POST", 
        headers: getAuthHeaders(), // <--- Crachá embutido aqui!
        body: JSON.stringify(body) 
    });
    
    mostrarToast("Histórico registrado!", "success");
    document.getElementById("hist-acao").value = "";
    carregarHistorico(assetId);
}

async function deletarHistorico(histId, assetId) {
    await fetch(`${API_URL}/history/${histId}`, { 
        method: "DELETE",
        headers: getAuthHeaders() // <--- Crachá embutido aqui!
    });
    mostrarToast("Registro apagado.", "success");
    carregarHistorico(assetId);
}