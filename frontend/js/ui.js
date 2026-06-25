const API_URL = "http://localhost:8000/api/v1";
let acaoConfirmacaoPendente = null;

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

function mudarAba(aba) {
    // 1. Array atualizado com a aba "usuarios"
    ["lista", "pecas", "suprimentos", "dashboard", "usuarios", "auditoria"].forEach(id => {
        document.getElementById(`aba-${id}`).classList.add("hidden");
        document.getElementById(`btn-aba-${id}`).classList.remove("bg-slate-800");
    });
    
    document.getElementById(`aba-${aba}`).classList.remove("hidden");
    document.getElementById(`btn-aba-${aba}`).classList.add("bg-slate-800");
    localStorage.setItem("aba_atual", aba);

    // 2. Usando a variável "aba" corretamente para todas as condições
    if (aba === 'lista') carregarAtivos();
    if (aba === 'pecas') carregarPecas();
    if (aba === 'suprimentos') carregarSuprimentos();
    if (aba === 'dashboard') atualizarDashboard();
    if (aba === 'usuarios') carregarUsuarios();
    if (aba === 'auditoria') carregarAuditoria();
}