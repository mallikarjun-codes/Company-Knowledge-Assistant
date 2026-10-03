from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ingestion import process_document
from app.services.chat import generate_answer  # New import

router = APIRouter()

# ... (keep your existing IngestRequest and /api/ingest route)

class ChatRequest(BaseModel):
    question: str

@router.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    try:
        answer = generate_answer(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))