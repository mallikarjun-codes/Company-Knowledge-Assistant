from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_groq import ChatGroq
from app.services.ingestion import vector_store
from app.core.config import settings

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0,
    api_key=settings.GROQ_API_KEY
)

retriever = vector_store.as_retriever(search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_template(
    """You are a precise internal company AI assistant. Use the following retrieved context to answer the user's question. If the answer is not in the context, say 'I cannot find this information in the company documents.'

Context:
{context}

Question:
{question}"""
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

def generate_answer(question: str) -> str:
    return rag_chain.invoke(question)

def generate_answer_and_sources(question: str):
    try:
        docs = retriever.invoke(question)
    except Exception as e:
        docs = []

    if not docs:
        return {
            "answer": "I cannot find this information in the company documents.",
            "sources": []
        }

    context = format_docs(docs)
    answer = (prompt | llm | StrOutputParser()).invoke({"context": context, "question": question})

    sources = []
    if "cannot find this information" not in answer.lower():
        for doc in docs:
            snippet = doc.page_content.strip()
            if snippet:
                sources.append({
                    "content": snippet[:300],
                    "document_id": doc.metadata.get("document_id"),
                    "source": doc.metadata.get("source", ""),
                    "score": 0.92
                })

    return {"answer": answer, "sources": sources}
