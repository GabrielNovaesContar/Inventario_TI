let listaPecasGlobal = [];

async function carregarPecas() {
    const res = await fetch(`${API_URL}/parts`, {
        method: "GET",
        headers: getAuthHeaders() // Mostrando o crachá
    });
    
    if (res.status === 401) return sair();
    
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
        headers: getAuthHeaders(), // Mostrando o crachá
        body: JSON.stringify(b) 
    });
    mostrarToast("Peça salva com sucesso!");
    fecharModalPeca(); carregarPecas();
}

async function deletarPeca(id) {
    await fetch(`${API_URL}/parts/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders() // Mostrando o crachá
    });
    mostrarToast("Peça excluída.", "success");
    carregarPecas();
}

async function alterarEstoquePeca(pJSON, modifier) {
    const p = JSON.parse(decodeURIComponent(pJSON));
    p.quantity += modifier;
    if(p.quantity < 0) return; 
    await fetch(`${API_URL}/parts/${p.id}`, { 
        method: "PUT", 
        headers: getAuthHeaders(), // Mostrando o crachá
        body: JSON.stringify(p) 
    });
    carregarPecas();
}