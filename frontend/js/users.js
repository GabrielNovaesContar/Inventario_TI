async function carregarUsuarios() {
    const res = await fetch(`${API_URL}/auth/users`, {
        method: "GET",
        headers: getAuthHeaders() // Mostra o crachá
    });
    
    if (res.status === 401) return sair();
    
    const usuarios = await res.json();
    desenharTabelaUsuarios(usuarios);
}

function desenharTabelaUsuarios(usuarios) {
    const tbody = document.getElementById("tabela-usuarios");
    tbody.innerHTML = "";
    
    usuarios.forEach(u => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 border-b";
        
        // Se for o admin@ti.com, esconde o botão de excluir e mostra uma tag
        const acoes = u.email === 'admin@ti.com' 
            ? '<span class="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">Admin Padrão</span>'
            : `<button onclick="pedirConfirmacao('Deseja revogar o acesso deste usuário?', () => deletarUsuario('${u.id}'))" class="text-red-600 font-semibold text-sm hover:text-red-800">Excluir Acesso</button>`;

        tr.innerHTML = `
            <td class="p-4 font-bold text-slate-800">${u.name}</td>
            <td class="p-4 text-slate-600">${u.email}</td>
            <td class="p-4 text-right">${acoes}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function deletarUsuario(id) {
    const res = await fetch(`${API_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders() // Mostra o crachá
    });
    
    if (res.ok) {
        mostrarToast("Acesso revogado com sucesso!", "success");
        carregarUsuarios(); // Atualiza a lista na tela
    } else {
        const erro = await res.json();
        mostrarToast(erro.detail || "Erro ao excluir", "error");
    }
}