# backend/main.py

import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.routers import health, rag, metrics, app_state

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga el pipeline RAG al arrancar el servidor."""

    from src.scripts.chunking import chunk_all_documents
    from src.scripts.vectorstore import load_vectorstore
    from src.scripts.rag_chain_BM25 import build_rag_chain

    app_state.chunks = chunk_all_documents()
    vectorstore = load_vectorstore()
    app_state.chain_fn, app_state.hybrid_fn = build_rag_chain(
        vectorstore, app_state.chunks
    )

    print("Pipeline RAG listo.")
    yield
    print("Cerrando servidor.")


app = FastAPI(
    title="RAG Legal API",
    description="API para consultas sobre RGPD, LOPDGDD y guías de la AEPD",
    version="1.0.0",
    lifespan=lifespan
)

# CORS peticiones desde el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(rag.router, tags=["RAG"])
app.include_router(metrics.router, tags=["Metrics"])