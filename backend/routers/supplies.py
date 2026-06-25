from fastapi import APIRouter, Depends
from schemas import SupplyRequest
from database import get_db_connection
import uuid
from security import get_current_user
from audit import log_action

router = APIRouter(
    prefix="/api/v1", 
    tags=["Supplies"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/supplies")
def create_supply(supply: SupplyRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    sup_id = str(uuid.uuid4())
    conn.cursor().execute(
        "INSERT INTO supplies (id, type, model, quantity, is_deleted) VALUES (?, ?, ?, ?, 0)", 
        (sup_id, supply.type, supply.model, supply.quantity)
    )
    
    log_action(conn, current_email, "CREATE", "supplies", sup_id, supply.dict())
    
    conn.commit()
    return {"message": "Suprimento salvo", "id": sup_id}

@router.get("/supplies")
def get_supplies():
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM supplies WHERE is_deleted = 0")
    return [{"id": r[0], "type": r[1], "model": r[2], "quantity": r[3]} for r in cur.fetchall()]

@router.put("/supplies/{sup_id}")
def update_supply(sup_id: str, supply: SupplyRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.cursor().execute(
        "UPDATE supplies SET type=?, model=?, quantity=? WHERE id=?", 
        (supply.type, supply.model, supply.quantity, sup_id)
    )
    
    log_action(conn, current_email, "UPDATE", "supplies", sup_id, supply.dict())
    
    conn.commit()
    return {"message": "Atualizado"}

@router.delete("/supplies/{sup_id}")
def delete_supply(sup_id: str, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.cursor().execute("UPDATE supplies SET is_deleted = 1 WHERE id=?", (sup_id,))
    
    log_action(conn, current_email, "SOFT_DELETE", "supplies", sup_id, {"action": "moved_to_trash"})
    
    conn.commit()
    return {"message": "Deletado"}