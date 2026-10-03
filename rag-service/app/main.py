from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="RAG Service",
    description="Retrieval-Augmented Generation service for the Company Knowledge Assistant",
    version="0.1.0"
)

app.include_router(router)


@app.get("/")
def root():
    return {"message": "RAG Service is running"}
