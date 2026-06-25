document.addEventListener("DOMContentLoaded", () => {
    const tokenSalvo = localStorage.getItem("token_ti");
    if (tokenSalvo) mostrarPainel();
    if(document.getElementById("hist-data")) {
        document.getElementById("hist-data").valueAsDate = new Date();
    }
});

async function fazerLogin() {
    // Agora o sistema captura o que você realmente digitou na tela
    const emailDigitado = document.getElementById("email").value;
    const senhaDigitada = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailDigitado, password: senhaDigitada })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Guarda o token real criptografado no navegador
            localStorage.setItem("token_ti", data.token); 
            mostrarPainel();
            mostrarToast("Bem-vindo, " + data.user_name + "!", "success");
        } else {
            // Se o FastAPI retornar o erro 401 que configuramos
            mostrarToast("E-mail ou senha incorretos!", "error");
        }
    } catch (error) { 
        mostrarToast("Servidor Python offline!", "error"); 
    }
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

// ==========================================
// FUNÇÃO NOVA: ENVIAR CADASTRO PARA O PYTHON
// ==========================================
async function fazerCadastro() {
    const nome = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const senha = document.getElementById("reg-password").value;

    if (!nome || !email || !senha) {
        mostrarToast("Preencha todos os campos!", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nome, email: email, password: senha })
        });

        if (response.ok) {
            mostrarToast("Conta criada com sucesso! Faça o login.", "success");
            toggleTelasAuth(); // Alterna de volta para a tela de login
        } else {
            const erro = await response.json();
            mostrarToast(erro.detail || "Erro ao cadastrar.", "error");
        }
    } catch (error) {
        mostrarToast("Servidor Python offline!", "error");
    }
}

// Função auxiliar para alternar a interface entre Login e Cadastro
function toggleTelasAuth() {
    const cardLogin = document.getElementById("card-login");
    const cardCadastro = document.getElementById("card-cadastro");
    
    if (cardLogin.classList.contains("hidden")) {
        cardLogin.classList.remove("hidden");
        cardCadastro.classList.add("hidden");
    } else {
        cardLogin.classList.add("hidden");
        cardCadastro.classList.remove("hidden");
    }
}