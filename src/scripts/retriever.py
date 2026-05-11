# src/retriever.py
import os
import sys
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document


def build_hybrid_retriever(vectorstore: Chroma, chunks: list[Document], k: int = 4,
                           bm25_weight: float = 0.4, semantic_weight: float = 0.6):
    """
    BM25 + semántico sin EnsembleRetriever.
    Fusiona resultados por puntuación ponderada (Reciprocal Rank Fusion).
    """

    bm25_retriever = BM25Retriever.from_documents(chunks)
    bm25_retriever.k = k * 2

    semantic_retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k * 2}
    )

    def retrieve(query: str) -> list[Document]:
        bm25_docs = bm25_retriever.invoke(query)
        semantic_docs = semantic_retriever.invoke(query)

        scores = {}
        seen_content = {}

        for rank, doc in enumerate(bm25_docs):
            key = doc.page_content[:80]
            if key not in scores:
                scores[key] = 0
                seen_content[key] = doc
            scores[key] += bm25_weight * (1 / (rank + 1))

        for rank, doc in enumerate(semantic_docs):
            key = doc.page_content[:80]
            if key not in scores:
                scores[key] = 0
                seen_content[key] = doc
            scores[key] += semantic_weight * (1 / (rank + 1))

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [seen_content[key] for key, _ in ranked[:k]]

    return retrieve


def compare_retrievers(vectorstore: Chroma,
                       chunks: list[Document],
                       query: str):

    print(f"QUERY: {query}")

    basic = vectorstore.as_retriever(search_kwargs={"k": 4})
    basic_docs = basic.invoke(query)
    print("[BÁSICO — solo semántico]")
    for i, doc in enumerate(basic_docs):
        source = doc.metadata.get("source_id", "?")
        print(f"  [{i+1}] {source:<15} | "
              f"{doc.page_content[:100].strip()}...")

    hybrid_fn = build_hybrid_retriever(vectorstore, chunks)
    hybrid_docs = hybrid_fn(query)
    print("[HÍBRIDO — semántico + BM25]")
    for i, doc in enumerate(hybrid_docs):
        source = doc.metadata.get("source_id", "?")
        print(f"  [{i+1}] {source:<15} | "
              f"{doc.page_content[:100].strip()}...")


if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from chunking import chunk_all_documents
    from vectorstore import load_vectorstore

    chunks = chunk_all_documents()
    vectorstore = load_vectorstore()

    queries = [
        "¿Qué derechos tiene el interesado sobre sus datos?",
        "Art. 17 supresión derecho al olvido",
        "¿Cuáles son las multas por incumplir el RGPD?",
        "¿Qué es la protección de datos por defecto?",
        "¿Cuándo es obligatorio designar un DPD?",
    ]

    for query in queries:
        compare_retrievers(vectorstore, chunks, query)