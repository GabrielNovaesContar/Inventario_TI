from fastapi import APIRouter
from schemas import PartRequest
from database import get_db_connection
import uuid

# Mudamos o prefixo para a raiz da API, igual aos ativos
router = APIRouter(prefix="/api/v1", tags=["Parts"])

@router.post("/parts")
def create_part(part: PartRequest):
    conn = get_db_connection()
    part_id = str(uuid.uuid4())
    conn.cursor().execute("INSERT INTO parts VALUES (?, ?, ?, ?)", (part_id, part.name, part.brand, part.quantity))
    conn.commit()
    return {"message": "Peça salva com sucesso", "id": part_id}

@router.get("/parts")
def get_parts():
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM parts")
    return [{"id": r[0], "name": r[1], "brand": r[2], "quantity": r[3]} for r in cur.fetchall()]

@router.put("/parts/{part_id}")
def update_part(part_id: str, part: PartRequest):
    conn = get_db_connection()
    conn.cursor().execute("UPDATE parts SET name=?, brand=?, quantity=? WHERE id=?", (part.name, part.brand, part.quantity, part_id))
    conn.commit()
    return {"message": "Peça atualizada com sucesso"}

@router.delete("/parts/{part_id}")
def delete_part(part_id: str):
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM parts WHERE id=?", (part_id,))
    conn.commit()
    return {"message": "Deletado com sucesso"}