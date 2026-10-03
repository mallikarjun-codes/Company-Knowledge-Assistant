from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ingestion import process_document
from app.services.chat import generate_answer_and_sources, generate_answer

router = APIRouter()

class IngestRequest(BaseModel):
    file_path: str
    file_type: str
    document_id: int

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/api/ingest")
def ingest_document(request: IngestRequest):
    try:
        process_document(
            file_path=request.file_path,
            file_type=request.file_type,
            document_id=request.document_id,
        )
        return {"status": "success", "message": "Document ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    question: str

@router.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    try:
        result = generate_answer_and_sources(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))