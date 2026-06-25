from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import uuid
from database import get_db_connection
from security import verify_password, create_access_token, get_password_hash

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# Modelo para a requisição de Login
class LoginRequest(BaseModel):
    email: str
    password: str

# MODELO NOVO: Para a requisição de Cadastro
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

# ==========================================
# ROTA DE LOGIN (JÁ EXISTIA)
# ==========================================
@router.post("/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, password_hash, name FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()

    if not user or not verify_password(request.password, user[2]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    token_data = {"sub": user[1], "name": user[3]}
    access_token = create_access_token(data=token_data)

    return {"token": access_token, "user_name": user[3]}


# ==========================================
# ROTA NOVA: CADASTRO DE USUÁRIOS
# ==========================================
@router.post("/register")
def register(request: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Verifica se o e-mail já está cadastrado no sistema
    cursor.execute("SELECT email FROM users WHERE email = ?", (request.email,))
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )

    # 2. Gera um ID único e criptografa a nova senha com Bcrypt
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)

    # 3. Salva o novo usuário de forma segura no banco de dados
    try:
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
            (user_id, request.email, hashed_password, request.name)
        )
        conn.commit()
        return {"message": "Usuário cadastrado com sucesso!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar o usuário no banco de dados."
        )