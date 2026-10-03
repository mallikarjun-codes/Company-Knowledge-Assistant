
from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="RAG Service")

app.include_router(router)

@app.get("/")
def root():
    return {"message": "RAG Service is running"}