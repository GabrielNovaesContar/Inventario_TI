import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

# Registra os roteadores
from routers import auth, assets, parts, supplies

app = FastAPI(title="API Inventário TI")

# =================================================================
# CORREÇÃO DE SEGURANÇA (CORS) - Permite comunicação com o Nginx
# =================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas ao iniciar
init_db()

# Registra as Rotas da API
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(parts.router)
app.include_router(supplies.router)

# REMOVIDO: O bloco do StaticFiles, pois o Nginx agora cuida do Frontend!

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)