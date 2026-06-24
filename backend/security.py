from datetime import datetime, timedelta
import jwt
import bcrypt  # <-- Usando bcrypt puro e moderno!
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ==========================================
# CONFIGURAÇÕES DE SEGURANÇA
# ==========================================
SECRET_KEY = "inventario_ti_super_secreto_2026_!@#"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600 # O token dura 10 horas

# ==========================================
# FUNÇÕES DO MOTOR
# ==========================================
def get_password_hash(password: str) -> str:
    """
    Recebe a senha limpa, converte para bytes e gera o Hash irreversível.
    """
    # O bcrypt exige que o texto seja convertido para bytes antes de criptografar
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    
    # Devolvemos como texto (string) para poder salvar no SQLite tranquilamente
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha digitada pelo usuário gera o mesmo Hash que está no banco.
    """
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    """
    Gera o Token JWT.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ==========================================
# CADEADO DAS ROTAS (FECHADURA)
# ==========================================
# Isso ensina o FastAPI a procurar a chave no cabeçalho (Header) da requisição
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Toda rota que tiver este cadeado vai rodar essa função antes de abrir.
    Ela confere se o Token é verdadeiro, se foi assinado por nós e se não venceu.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        return email
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")