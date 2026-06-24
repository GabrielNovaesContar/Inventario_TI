from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database import get_db_connection
from security import verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# O modelo do que o frontend vai enviar
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Busca o usuário no banco de dados pelo e-mail
    cursor.execute("SELECT id, email, password_hash, name FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()

    # 2. Se não achar o e-mail, ou se a senha matemática não bater, barra o acesso
    if not user or not verify_password(request.password, user[2]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    # 3. Se a senha estiver correta, gera o crachá digital (Token JWT)
    # user[1] é o e-mail, user[3] é o nome do administrador
    token_data = {"sub": user[1], "name": user[3]}
    access_token = create_access_token(data=token_data)

    # Devolve o token real para o navegador guardar
    return {"token": access_token, "user_name": user[3]}