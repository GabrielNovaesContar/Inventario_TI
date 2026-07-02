# Usa uma versão oficial e leve do Python
FROM python:3.11-slim

# Define a pasta de trabalho dentro do contêiner
WORKDIR /app

# Copia a lista de dependências e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código do backend para o contêiner
COPY . .

# Expõe a porta que a API vai rodar
EXPOSE 8000

# O comando que o servidor vai executar ao ligar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]