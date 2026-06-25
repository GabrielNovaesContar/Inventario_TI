import sqlite3
import os
import sys
import uuid
from security import get_password_hash

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
    
    # === TABELAS COM SUPORTE A SOFT DELETE (is_deleted) ===
    # O Soft Delete permite "esconder" registros sem apagá-los fisicamente, preservando a integridade.
    cursor.execute('''CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        patrimony TEXT, 
        serial_number TEXT, 
        status TEXT, 
        category TEXT, 
        sector TEXT, 
        specs TEXT, 
        responsible TEXT,
        is_deleted INTEGER DEFAULT 0
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        brand TEXT, 
        quantity INTEGER,
        is_deleted INTEGER DEFAULT 0
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS supplies (
        id TEXT PRIMARY KEY, 
        type TEXT, 
        model TEXT, 
        quantity INTEGER,
        is_deleted INTEGER DEFAULT 0
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        email TEXT UNIQUE, 
        password_hash TEXT, 
        name TEXT,
        is_deleted INTEGER DEFAULT 0
    )''')
    
    # Tabela de histórico de movimentação (Interação Humana)
    cursor.execute('''CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY, 
        asset_id TEXT, 
        date TEXT, 
        action TEXT, 
        user TEXT
    )''')
    
    # === TABELA DE AUDITORIA (Rastreabilidade Automática) ===
    # Registra QUEM fez O QUÊ, QUANDO e em QUAL REGISTRO.
    cursor.execute('''CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, 
        timestamp TEXT, 
        user_email TEXT, 
        action_type TEXT, 
        table_name TEXT, 
        record_id TEXT,
        details TEXT
    )''')
    
    # === CRIAÇÃO DO ADMIN PADRÃO ===
    cursor.execute("SELECT email FROM users WHERE email = 'admin@ti.com'")
    admin_exists = cursor.fetchone()
    
    if not admin_exists:
        admin_id = str(uuid.uuid4())
        senha_criptografada = get_password_hash("123456")
        
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name, is_deleted) VALUES (?, ?, ?, ?, ?)", 
            (admin_id, "admin@ti.com", senha_criptografada, "Administrador TI", 0)
        )
        print("Usuário Admin padrão criado com sucesso!")

    conn.commit()