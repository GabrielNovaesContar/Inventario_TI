async function carregarAuditoria() {
    const res = await fetch(`${API_URL}/auth/audit-logs`, {
        headers: getAuthHeaders()
    });
    
    if (res.status === 401) return sair();
    
    const logs = await res.json();
    const tbody = document.getElementById("tabela-auditoria");
    tbody.innerHTML = "";
    
    // MÁGICA VISUAL: Mapeia todos os IDs que já foram restaurados
    const idsRestaurados = logs.filter(l => l.action_type === "RESTORE").map(l => l.record_id);
    
    logs.forEach(log => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 border-b text-sm transition";
        
        const dataObj = new Date(log.timestamp + "Z"); 
        const dataFormatada = dataObj.toLocaleString('pt-BR');
        
        let corAcao = "text-blue-700 bg-blue-100"; 
        if (log.action_type === "UPDATE") corAcao = "text-amber-700 bg-amber-100";
        if (log.action_type === "RESTORE") corAcao = "text-emerald-700 bg-emerald-100";
        if (log.action_type.includes("DELETE")) corAcao = "text-red-700 bg-red-100";
        
        let detalhesTexto = "";
        try {
            const det = JSON.parse(log.details);
            if (Object.keys(det).length > 0) {
                detalhesTexto = Object.entries(det)
                    .map(([chave, valor]) => `<span class="font-semibold text-slate-600">${chave}:</span> ${valor}`)
                    .join('<br>');
            } else {
                detalhesTexto = '<span class="text-slate-400 italic">Sem detalhes registados</span>';
            }
        } catch(e) { detalhesTexto = log.details; }

        // O botão SÓ aparece se foi deletado E se o ID não estiver na lista de restaurados
        let botaoRestaurar = "";
        if (log.action_type === "SOFT_DELETE" && !idsRestaurados.includes(log.record_id)) {
            botaoRestaurar = `<br><button onclick="pedirConfirmacao('Deseja restaurar este registro para o sistema?', () => restaurarRegistro('${log.table_name}', '${log.record_id}'))" class="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded font-bold text-xs transition shadow-sm">↺ Restaurar</button>`;
        }

        tr.innerHTML = `
            <td class="p-3 font-mono text-slate-500 whitespace-nowrap">${dataFormatada}</td>
            <td class="p-3 font-semibold text-slate-800">${log.user_email}</td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold shadow-sm ${corAcao}">${log.action_type}</span></td>
            <td class="p-3 font-bold text-slate-500 uppercase">${log.table_name}</td>
            <td class="p-3 text-xs text-slate-500">${detalhesTexto} ${botaoRestaurar}</td>
        `;
        tbody.appendChild(tr);
    });
}
// NOVA FUNÇÃO: Chama a rota de restauração do Python
async function restaurarRegistro(tabela, id) {
    try {
        const response = await fetch(`${API_URL}/auth/restore/${tabela}/${id}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            mostrarToast("Registro restaurado com sucesso!", "success");
            carregarAuditoria(); // Atualiza a tela de auditoria
        } else {
            const erro = await response.json();
            mostrarToast(erro.detail || "Erro ao restaurar.", "error");
        }
    } catch (error) {
        mostrarToast("Erro de conexão com o servidor.", "error");
    }
}