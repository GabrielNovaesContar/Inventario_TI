import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, assets, parts, supplies
import uvicorn
from fastapi.staticfiles import StaticFiles
import sys

app = FastAPI(title="API Inventário TI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas ao iniciar
init_db()

# Registra as Rotas
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(parts.router)
app.include_router(supplies.router)

if getattr(sys, 'frozen', False):
    frontend_dir = os.path.join(os.path.dirname(sys.executable), "frontend")
else:
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
