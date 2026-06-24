import sqlite3
import os
import sys
import uuid
from security import get_password_hash  # <-- Importando o nosso motor de segurança

# Inteligência para descobrir onde salvar o banco de dados
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

db_path = os.path.join(BASE_DIR, 'inventario.db')

def get_db_connection():
    return sqlite3.connect(db_path, check_same_thread=False)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Cria as tabelas do sistema que já tínhamos
    cursor.execute('''CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, patrimony TEXT, serial_number TEXT, status TEXT, category TEXT, sector TEXT, specs TEXT, responsible TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, asset_id TEXT, date TEXT, action TEXT, user TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS parts (id TEXT PRIMARY KEY, name TEXT, brand TEXT, quantity INTEGER)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS supplies (id TEXT PRIMARY KEY, type TEXT, model TEXT, quantity INTEGER)''')
    
    # === NOVA TABELA DE USUÁRIOS ===
    # O UNIQUE garante que o banco nunca vai aceitar dois usuários com o mesmo e-mail
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT)''')
    
    # === CRIAÇÃO AUTOMÁTICA DO ADMIN PADRÃO ===
    cursor.execute("SELECT email FROM users WHERE email = 'admin@ti.com'")
    admin_exists = cursor.fetchone()
    
    if not admin_exists:
        admin_id = str(uuid.uuid4())
        # Criptografando a senha "123456" para o primeiro acesso
        senha_criptografada = get_password_hash("123456")
        
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)", 
            (admin_id, "admin@ti.com", senha_criptografada, "Administrador TI")
        )
        print("Usuário Admin padrão criado com sucesso no banco de dados!")

    conn.commit()