from fastapi import APIRouter, Depends, HTTPException
from schemas import AssetRequest, HistoryRequest
from database import get_db_connection
import uuid
import datetime
from security import get_current_user
from audit import log_action  # <-- Importando o Motor de Auditoria

router = APIRouter(
    prefix="/api/v1", 
    tags=["Assets"],
    dependencies=[Depends(get_current_user)]
)

# ==========================================
# ROTAS DE EQUIPAMENTOS (ASSETS)
# ==========================================
@router.post("/assets")
def create_asset(asset: AssetRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    asset_id = str(uuid.uuid4())
    
    conn.cursor().execute(
        "INSERT INTO assets (id, name, patrimony, serial_number, status, category, sector, specs, responsible, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)", 
        (asset_id, asset.name, asset.patrimony, asset.serial_number, asset.status, asset.category, asset.sector, asset.specs, asset.responsible)
    )
    
    # GRAVANDO O LOG INVISÍVEL
    log_action(conn, current_email, "CREATE", "assets", asset_id, asset.dict())
    
    conn.commit()
    return {"message": "Ativo criado com sucesso", "id": asset_id}

@router.get("/assets")
def get_assets():
    cur = get_db_connection().cursor()
    # MUDANÇA CRÍTICA: Só carrega equipamentos que não foram enviados para a lixeira
    cur.execute("SELECT * FROM assets WHERE is_deleted = 0")
    
    assets = []
    for r in cur.fetchall():
        assets.append({
            "id": r[0], "name": r[1], "patrimony": r[2], "serial_number": r[3],
            "status": r[4], "category": r[5], "sector": r[6], "specs": r[7], "responsible": r[8]
        })
    return assets

@router.put("/assets/{asset_id}")
def update_asset(asset_id: str, asset: AssetRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    
    conn.cursor().execute(
        "UPDATE assets SET name=?, patrimony=?, serial_number=?, status=?, category=?, sector=?, specs=?, responsible=? WHERE id=?", 
        (asset.name, asset.patrimony, asset.serial_number, asset.status, asset.category, asset.sector, asset.specs, asset.responsible, asset_id)
    )
    
    # GRAVANDO O LOG INVISÍVEL
    log_action(conn, current_email, "UPDATE", "assets", asset_id, asset.dict())
    
    conn.commit()
    return {"message": "Ativo atualizado com sucesso"}

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: str, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    
    # MUDANÇA CRÍTICA (SOFT DELETE): Não apaga de verdade, apenas oculta!
    conn.cursor().execute("UPDATE assets SET is_deleted = 1 WHERE id=?", (asset_id,))
    
    # GRAVANDO O LOG INVISÍVEL
    log_action(conn, current_email, "SOFT_DELETE", "assets", asset_id, {"action": "moved_to_trash"})
    
    conn.commit()
    return {"message": "Ativo movido para a lixeira (Soft Delete)"}

# ==========================================
# ROTAS DE HISTÓRICO MANUAL
# ==========================================
@router.post("/assets/{asset_id}/history")
def add_history(asset_id: str, history: HistoryRequest, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    hist_id = str(uuid.uuid4())
    conn.cursor().execute(
        "INSERT INTO history (id, asset_id, date, action, user) VALUES (?, ?, ?, ?, ?)", 
        (hist_id, asset_id, history.date, history.action, history.user)
    )
    
    # Auditando até a inserção no histórico manual
    log_action(conn, current_email, "CREATE", "history", hist_id, history.dict())
    
    conn.commit()
    return {"message": "Histórico adicionado", "id": hist_id}

@router.get("/assets/{asset_id}/history")
def get_history(asset_id: str):
    cur = get_db_connection().cursor()
    cur.execute("SELECT * FROM history WHERE asset_id=? ORDER BY date DESC", (asset_id,))
    return [{"id": r[0], "date": r[2], "action": r[3], "user": r[4]} for r in cur.fetchall()]

@router.delete("/history/{history_id}")
def delete_history(history_id: str, current_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    
    # Histórico secundário pode ser HARD DELETE, mas deixamos o log gravado
    conn.cursor().execute("DELETE FROM history WHERE id=?", (history_id,))
    log_action(conn, current_email, "HARD_DELETE", "history", history_id, {"action": "permanently_deleted"})
    
    conn.commit()
    return {"message": "Histórico removido"}