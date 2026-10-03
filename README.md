# Company Knowledge Assistant

A corporate knowledge management and search system leveraging Retrieval-Augmented Generation (RAG).

## Architecture Overview

The application is structured as a multi-service architecture comprising:

- **Backend (`backend/`)**: Node.js core server handling user management, authentication, document metadata, and API orchestration.
- **RAG Service (`rag-service/`)**: Python FastAPI service handling document ingestion, text embedding generation, vector search, and RAG retrieval pipelines.
- **Frontend (`frontend/`)**: React web interface providing interactive user interfaces for knowledge query, search visualization, and document management.
- **Database**: PostgreSQL with `pgvector` extension for structured relational data storage and efficient vector similarity search.

## Repository Structure

```
.
├── backend/        # Node.js backend application
├── rag-service/    # Python FastAPI RAG service
├── frontend/       # React frontend application
├── .gitignore      # Root Git ignore rules
└── README.md       # Root project documentation
```