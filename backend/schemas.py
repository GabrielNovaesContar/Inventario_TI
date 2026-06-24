from pydantic import BaseModel

class AssetRequest(BaseModel):
    name: str
    patrimony: str
    serial_number: str = ""
    status: str = "IN_STOCK"
    category: str = "COMPUTADOR"
    sector: str = "TI"
    specs: str = ""
    responsible: str = ""

class HistoryRequest(BaseModel):
    date: str
    action: str
    user: str

class PartRequest(BaseModel):
    name: str
    brand: str
    quantity: int

class SupplyRequest(BaseModel):
    type: str
    model: str
    quantity: int

class LoginRequest(BaseModel):
    email: str
    password: str