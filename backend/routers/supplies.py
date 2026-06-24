from fastapi import APIRouter, Depends
from schemas import SupplyRequest
from database import get_db_connection
import uuid
from security import get_current_user # <-- Importando o cadeado

# Adicionamos o cadeado aqui
router = APIRouter(
    prefix="/api/v1", 
    tags=["Supplies"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/supplies")
def create_supply(supply: SupplyRequest):
    conn = get_db_connection()
    sup_id = str(uuid.uuid4())
    conn.cursor().execute("INSERT INTO supplies VALUES (?, ?, ?, ?)", (sup_id, supply.type, supply.model, supply.quantity))
    conn.commit()
    return {"message": "Suprimento salvo", "id": sup_id}

@router.get("/supplies")
def get_supplies():
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM supplies")
    return [{"id": r[0], "type": r[1], "model": r[2], "quantity": r[3]} for r in cur.fetchall()]

@router.put("/supplies/{sup_id}")
def update_supply(sup_id: str, supply: SupplyRequest):
    conn = get_db_connection()
    conn.cursor().execute("UPDATE supplies SET type=?, model=?, quantity=? WHERE id=?", (supply.type, supply.model, supply.quantity, sup_id))
    conn.commit()
    return {"message": "Atualizado"}

@router.delete("/supplies/{sup_id}")
def delete_supply(sup_id: str):
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM supplies WHERE id=?", (sup_id,))
    conn.commit()
    return {"message": "Deletado"}