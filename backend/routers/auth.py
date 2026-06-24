from fastapi import APIRouter
from schemas import LoginRequest

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/login")
def login(req: LoginRequest):
    return {"token": "token-dourado-do-python", "type": "Bearer", "expiresIn": 86400}