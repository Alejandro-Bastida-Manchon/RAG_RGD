# backend/routers/rag.py

import sys
import os
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "src"))

router = APIRouter()

# Modelos de request/response
class QuestionRequest(BaseModel):
    question: str
    k: int = 4  # número de chunks a recuperar

class ChunkResponse(BaseModel):
    content: str
    source_id: str
    titulo: str
    page: str

class AnswerResponse(BaseModel):
    question: str
    answer: str
    chunks: list[ChunkResponse]
    sources: list[str]


def get_pipeline():
    from fastapi import Request
    pass


import asyncio
from datetime import datetime

@router.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest, background_tasks: BackgroundTasks):
    from src.backend.routers import app_state
    from fastapi import BackgroundTasks

    try:
        chain_fn = app_state.chain_fn
        hybrid_fn = app_state.hybrid_fn

        if chain_fn is None or hybrid_fn is None:
            raise HTTPException(status_code=503,
                detail="Pipeline RAG no inicializado.")

        docs   = hybrid_fn(request.question)
        result = chain_fn(request.question)
        answer = result[0] if isinstance(result, tuple) else result

        chunks = []
        sources = set()
        for doc in docs:
            source_id = doc.metadata.get("source_id", "?")
            sources.add(source_id)
            chunks.append(ChunkResponse(
                content=doc.page_content[:500],
                source_id=source_id,
                titulo=str(doc.metadata.get("titulo_2",
                          doc.metadata.get("titulo_1", ""))),
                page=str(doc.metadata.get("page", ""))
            ))

        # Evalúa en background para no bloquear la respuesta
        background_tasks.add_task(
            evaluate_and_log,
            request.question,
            answer,
            [doc.page_content for doc in docs]
        )

        return AnswerResponse(
            question=request.question,
            answer=answer,
            chunks=chunks,
            sources=list(sources)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def evaluate_and_log(question: str, answer: str, contexts: list[str]):
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import Faithfulness, AnswerRelevancy
        from langchain_community.llms import Ollama
        from langchain_huggingface import HuggingFaceEmbeddings
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper

        dataset = Dataset.from_dict({
            "question":     [question],
            "answer":       [answer],
            "contexts":     [contexts],
            "ground_truth": [""]   
        })

        llm = LangchainLLMWrapper(Ollama(model="mistral", temperature=0))
        emb = LangchainEmbeddingsWrapper(HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        ))

        result = evaluate(
            dataset=dataset,
            metrics=[
                Faithfulness(llm=llm),
                AnswerRelevancy(llm=llm, embeddings=emb),
            ],
        )
        df = result.to_pandas()

        entry = {
            "question":         question,
            "answer":           answer[:300],
            "faithfulness":     round(float(df["faithfulness"].iloc[0]), 3)
                                if "faithfulness" in df.columns else None,
            "answer_relevancy": round(float(df["answer_relevancy"].iloc[0]), 3)
                                if "answer_relevancy" in df.columns else None,
            "timestamp":        datetime.now().isoformat()
        }

        log = []
        if REALTIME_LOG.exists():
            with open(REALTIME_LOG, "r", encoding="utf-8") as f:
                log = json.load(f)

        log.append(entry)

        with open(REALTIME_LOG, "w", encoding="utf-8") as f:
            json.dump(log, f, ensure_ascii=False, indent=2)

        print(f"[Eval] {question[:50]}... → F:{entry['faithfulness']} AR:{entry['answer_relevancy']}")

    except Exception as e:
        print(f"[Eval error] {e}")
    
    

import json
from pathlib import Path

REALTIME_LOG = Path("data/realtime_evaluations.json")

class EvalEntry(BaseModel):
    question: str
    answer: str
    contexts: list[str]
    faithfulness: float | None = None
    answer_relevancy: float | None = None
    context_precision: float | None = None
    context_recall: float | None = None
    timestamp: str


@router.get("/evaluations/realtime")
def get_realtime_evaluations():
    """Devuelve el historial de evaluaciones en tiempo real."""
    if not REALTIME_LOG.exists():
        return {"evaluations": [], "total": 0}
    with open(REALTIME_LOG, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"evaluations": data, "total": len(data)}


@router.delete("/evaluations/realtime")
def clear_realtime_evaluations():
    """Limpia el historial de evaluaciones."""
    if REALTIME_LOG.exists():
        REALTIME_LOG.unlink()
    return {"status": "cleared"}