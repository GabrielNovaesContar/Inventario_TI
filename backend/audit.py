import uuid
from datetime import datetime
import json

def log_action(conn, user_email: str, action_type: str, table_name: str, record_id: str, details: dict = None):
    """
    Regista uma ação na tabela de auditoria de forma invisível.
    """
    cursor = conn.cursor()
    log_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Transforma o dicionário de detalhes em um texto JSON (se houver detalhes)
    details_str = json.dumps(details) if details else "{}"
    
    cursor.execute(
        "INSERT INTO audit_logs (id, timestamp, user_email, action_type, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (log_id, timestamp, user_email, action_type, table_name, record_id, details_str)
    )