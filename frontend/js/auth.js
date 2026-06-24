document.addEventListener("DOMContentLoaded", () => {
    const tokenSalvo = localStorage.getItem("token_ti");
    if (tokenSalvo) mostrarPainel();
    if(document.getElementById("hist-data")) {
        document.getElementById("hist-data").valueAsDate = new Date();
    }
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

async function mostrarPainel() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    document.getElementById("app-screen").classList.add("flex");
    
    // CORREÇÃO CRÍTICA: Aguarda o banco de dados responder antes de desenhar a tela
    await Promise.all([
        carregarAtivos(),
        carregarPecas(),
        carregarSuprimentos()
    ]);

    const abaSalva = localStorage.getItem("aba_atual") || "lista";
    mudarAba(abaSalva);
}