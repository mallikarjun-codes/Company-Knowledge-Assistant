import os
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_postgres import PGVector
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.database import engine

# 1. Initialize the lightweight, fast embedding model
embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")

# 2. Initialize PostgreSQL vector store
vector_store = PGVector(
    embeddings=embeddings,
    collection_name="company_documents",
    connection=engine,
    use_jsonb=True,
)

def extract_text(file_path: str, file_type: str):
    """Routes to the correct document loader based on file type."""
    cleaned_path = file_path
    if len(cleaned_path) >= 2 and cleaned_path[1] == ':':
        drive = cleaned_path[0].lower()
        rest = cleaned_path[2:].replace('\\', '/')
        cleaned_path = f"/mnt/{drive}{rest}"

    abs_path = os.path.abspath(cleaned_path)
    
    if "pdf" in file_type:
        loader = PyPDFLoader(abs_path)
    elif "wordprocessingml" in file_type or "docx" in file_type:
        loader = Docx2txtLoader(abs_path)
    else:
        # Fallback for plain text, csv, etc.
        loader = TextLoader(abs_path, autodetect_encoding=True)
        
    return loader.load()

def process_document(file_path: str, file_type: str, document_id: int):
    """The complete RAG ingestion pipeline."""
    # 1. Extract text from the raw file
    documents = extract_text(file_path, file_type)
    
    # 2. Split the text into semantic chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    
    # 3. Inject the SQL document ID into the metadata so we can trace sources
    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        
    # 4. Convert chunks to embeddings and save to pgvector
    vector_store.add_documents(chunks)