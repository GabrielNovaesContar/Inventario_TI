import sqlite3
import os
import sys

# Inteligência para descobrir onde salvar o banco de dados
if getattr(sys, 'frozen', False):
    # Se estiver rodando como .exe, salva na mesma pasta do .exe
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Se estiver rodando no Python normal, salva na pasta do script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

db_path = os.path.join(BASE_DIR, 'inventario.db')

def get_db_connection():
    return sqlite3.connect(db_path, check_same_thread=False)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, patrimony TEXT, serial_number TEXT, status TEXT, category TEXT, sector TEXT, specs TEXT, responsible TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, asset_id TEXT, date TEXT, action TEXT, user TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS parts (id TEXT PRIMARY KEY, name TEXT, brand TEXT, quantity INTEGER)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS supplies (id TEXT PRIMARY KEY, type TEXT, model TEXT, quantity INTEGER)''')
    conn.commit()