from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import uuid
from database import get_db_connection
from security import verify_password, create_access_token, get_password_hash, get_current_user
from audit import log_action

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Proteção: Bloqueia login se o usuário foi "deletado"
    cursor.execute("SELECT id, email, password_hash, name FROM users WHERE email = ? AND is_deleted = 0", (request.email,))
    user = cursor.fetchone()

    if not user or not verify_password(request.password, user[2]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    token_data = {"sub": user[1], "name": user[3]}
    access_token = create_access_token(data=token_data)

    return {"token": access_token, "user_name": user[3]}

@router.post("/register")
def register(request: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT email FROM users WHERE email = ?", (request.email,))
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)

    cursor.execute(
        "INSERT INTO users (id, email, password_hash, name, is_deleted) VALUES (?, ?, ?, ?, 0)",
        (user_id, request.email, hashed_password, request.name)
    )
    
    # Auditando a criação da conta
    log_action(conn, request.email, "CREATE", "users", user_id, {"name": request.name, "email": request.email})
    
    conn.commit()
    return {"message": "Usuário cadastrado com sucesso!"}

@router.get("/users")
def get_users(current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Retorna apenas usuários ativos
    cursor.execute("SELECT id, name, email FROM users WHERE is_deleted = 0")
    users = cursor.fetchall()
    
    return [{"id": u[0], "name": u[1], "email": u[2]} for u in users]

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    if user and user[0] == 'admin@ti.com':
        raise HTTPException(status_code=400, detail="Não é possível excluir o administrador padrão.")
        
    cursor.execute("UPDATE users SET is_deleted = 1 WHERE id = ?", (user_id,))
    
    # Auditando a revogação de acesso
    log_action(conn, current_email, "SOFT_DELETE", "users", user_id, {"action": "access_revoked"})
    
    conn.commit()
    return {"message": "Acesso revogado com sucesso"}

# ==========================================
# ROTA DE AUDITORIA (LOGS INVISÍVEIS)
# ==========================================
@router.get("/audit-logs")
def get_audit_logs(current_email: str = Depends(get_current_user)):
    """Retorna os últimos 100 registros de auditoria do sistema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Busca ordenada do mais recente para o mais antigo, limitado a 100 para não travar a tela
    cursor.execute('''
        SELECT id, timestamp, user_email, action_type, table_name, details 
        FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT 100
    ''')
    logs = cursor.fetchall()
    
    return [{
        "id": r[0], 
        "timestamp": r[1], 
        "user_email": r[2], 
        "action_type": r[3], 
        "table_name": r[4], 
        "details": r[5]
    } for r in logs]

# ==========================================
# ROTA GLOBAL DE RESTAURAÇÃO (LIXEIRA)
# ==========================================
@router.post("/restore/{table_name}/{record_id}")
def restore_record(table_name: str, record_id: str, current_email: str = Depends(get_current_user)):
    """Restaura um registro que sofreu Soft Delete em qualquer tabela permitida."""
    
    # Trava de segurança contra SQL Injection (garante que só alteram tabelas reais)
    allowed_tables = ["assets", "parts", "supplies", "users"]
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail="Tabela não autorizada para restauração.")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Restaura o item mudando o is_deleted para 0
    # Obs: Usamos f-string na tabela porque nomes de tabela não aceitam o '?' do SQLite, 
    # mas está seguro devido à nossa trava `allowed_tables` acima.
    cursor.execute(f"UPDATE {table_name} SET is_deleted = 0 WHERE id = ?", (record_id,))
    
    # Grava no log que o item foi resgatado das cinzas!
    log_action(conn, current_email, "RESTORE", table_name, record_id, {"action": "restored_from_trash"})
    
    conn.commit()
    return {"message": f"Registro restaurado na tabela {table_name}!"}