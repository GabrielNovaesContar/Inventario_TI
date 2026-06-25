from fastapi import APIRouter, Depends
from schemas import PartRequest
from database import get_db_connection
import uuid
from security import get_current_user
from audit import log_action

router = APIRouter(
    prefix="/api/v1", 
    tags=["Parts"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/parts")
def create_part(part: PartRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    part_id = str(uuid.uuid4())
    conn.cursor().execute(
        "INSERT INTO parts (id, name, brand, quantity, is_deleted) VALUES (?, ?, ?, ?, 0)", 
        (part_id, part.name, part.brand, part.quantity)
    )
    
    log_action(conn, current_email, "CREATE", "parts", part_id, part.dict())
    
    conn.commit()
    return {"message": "Peça salva com sucesso", "id": part_id}

@router.get("/parts")
def get_parts():
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM parts WHERE is_deleted = 0")
    return [{"id": r[0], "name": r[1], "brand": r[2], "quantity": r[3]} for r in cur.fetchall()]

@router.put("/parts/{part_id}")
def update_part(part_id: str, part: PartRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.cursor().execute(
        "UPDATE parts SET name=?, brand=?, quantity=? WHERE id=?", 
        (part.name, part.brand, part.quantity, part_id)
    )
    
    log_action(conn, current_email, "UPDATE", "parts", part_id, part.dict())
    
    conn.commit()
    return {"message": "Atualizado com sucesso"}

@router.delete("/parts/{part_id}")
def delete_part(part_id: str, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.cursor().execute("UPDATE parts SET is_deleted = 1 WHERE id=?", (part_id,))
    
    log_action(conn, current_email, "SOFT_DELETE", "parts", part_id, {"action": "moved_to_trash"})
    
    conn.commit()
    return {"message": "Deletado com sucesso"}