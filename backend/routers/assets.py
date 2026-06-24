from fastapi import APIRouter, Depends
from schemas import AssetRequest, HistoryRequest
from database import get_db_connection
import uuid
import datetime
from security import get_current_user # <-- Importando o nosso cadeado

# Adicionamos o "dependencies" aqui. 
# Agora, TODAS as rotas de equipamentos exigem a chave!
router = APIRouter(
    prefix="/api/v1", 
    tags=["Assets"],
    dependencies=[Depends(get_current_user)] 
)

# ... (o resto do código continua igualzinho, não precisa mexer em nada abaixo disso)

@router.post("/assets")
def create_asset(asset: AssetRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    asset_id = str(uuid.uuid4())
    cur.execute("INSERT INTO assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                (asset_id, asset.name, asset.patrimony, asset.serial_number, asset.status, asset.category, asset.sector, asset.specs, asset.responsible))
    conn.commit()
    return {"message": "Salvo com sucesso", "id": asset_id}

@router.get("/assets")
def get_assets():
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM assets")
    return [{"id": r[0], "name": r[1], "patrimony": r[2], "serial_number": r[3], "status": r[4], "category": r[5], "sector": r[6], "specs": r[7], "responsible": r[8]} for r in cur.fetchall()]

@router.put("/assets/{asset_id}")
def update_asset(asset_id: str, asset: AssetRequest):
    conn = get_db_connection()
    conn.cursor().execute("UPDATE assets SET name=?, patrimony=?, serial_number=?, status=?, category=?, sector=?, specs=?, responsible=? WHERE id=?", 
                          (asset.name, asset.patrimony, asset.serial_number, asset.status, asset.category, asset.sector, asset.specs, asset.responsible, asset_id))
    conn.commit()
    return {"message": "Atualizado com sucesso"}

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: str):
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM assets WHERE id=?", (asset_id,))
    conn.cursor().execute("DELETE FROM history WHERE asset_id=?", (asset_id,))
    conn.commit()
    return {"message": "Deletado com sucesso"}

@router.post("/assets/{asset_id}/history")
def add_history(asset_id: str, hist: HistoryRequest):
    conn = get_db_connection()
    conn.cursor().execute("INSERT INTO history VALUES (?, ?, ?, ?, ?)", (str(uuid.uuid4()), asset_id, hist.date, hist.action, hist.user))
    conn.commit()
    return {"message": "Histórico adicionado"}

@router.get("/assets/{asset_id}/history")
def get_history(asset_id: str):
    cur = get_db_connection().cursor()
    cur.execute("SELECT id, date, action, user FROM history WHERE asset_id=? ORDER BY date DESC", (asset_id,))
    return [{"id": r[0], "date": r[1], "action": r[2], "user": r[3]} for r in cur.fetchall()]

@router.delete("/history/{hist_id}")
def delete_history(hist_id: str):
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM history WHERE id=?", (hist_id,))
    conn.commit()
    return {"message": "Histórico removido"}