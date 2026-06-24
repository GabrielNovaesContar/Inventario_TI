let listaSupsGlobal = [];

async function carregarSuprimentos() {
    const res = await fetch(`${API_URL}/supplies`, {
        method: "GET",
        headers: getAuthHeaders() // Mostrando o crachá
    });
    
    if (res.status === 401) return sair();
    
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
        headers: getAuthHeaders(), // Mostrando o crachá
        body: JSON.stringify(b) 
    });
    mostrarToast("Suprimento salvo com sucesso!");
    fecharModalSup(); carregarSuprimentos();
}

async function deletarSup(id) {
    await fetch(`${API_URL}/supplies/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders() // Mostrando o crachá
    });
    mostrarToast("Suprimento excluído.", "success");
    carregarSuprimentos();
}

async function alterarEstoqueSup(sJSON, modifier) {
    const s = JSON.parse(decodeURIComponent(sJSON));
    s.quantity += modifier;
    if(s.quantity < 0) return; 
    await fetch(`${API_URL}/supplies/${s.id}`, { 
        method: "PUT", 
        headers: getAuthHeaders(), // Mostrando o crachá
        body: JSON.stringify(s) 
    });
    carregarSuprimentos();
}