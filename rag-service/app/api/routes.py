from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.services.ingestion import process_document

router = APIRouter()


class IngestRequest(BaseModel):
    file_path: str
    file_type: str
    document_id: int


@router.get("/health")
def health_check():
    try:
        # Using a context manager ensures the connection is immediately returned to the pool
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "db_connection": "successful"}
    except Exception as e:
        return {"status": "error", "db_connection": "failed", "detail": str(e)}


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
        return {"status": "error", "message": str(e)}