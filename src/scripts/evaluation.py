# src/evaluation.py

import os
import sys
import json
import pandas as pd
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import Faithfulness, AnswerRelevancy, ContextPrecision, ContextRecall
from langchain_community.llms import Ollama
from langchain_huggingface import HuggingFaceEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def build_ragas_dataset(questions: list[dict],
                        chain_fn,
                        hybrid_fn) -> Dataset:
    """:
    1. Recupera chunks con el retriever híbrido
    2. Genera respuesta con el LLM
    3. Empaqueta en formato RAGAs
    """
    data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": []
    }

    total = len(questions)
    for i, item in enumerate(questions):
        question = item["question"]
        ground_truth = item["ground_truth"]

        print(f"  [{i+1}/{total}] {question[:65]}")

        docs = hybrid_fn(question)
        contexts = [doc.page_content for doc in docs]

        result = chain_fn(question)
        answer = result[0] if isinstance(result, tuple) else result

        data["question"].append(question)
        data["answer"].append(answer)
        data["contexts"].append(contexts)
        data["ground_truth"].append(ground_truth)

    return Dataset.from_dict(data)


def run_evaluation(ragas_dataset: Dataset) -> pd.DataFrame:
    llm = Ollama(model="mistral", temperature=0)
    wrapped_llm = LangchainLLMWrapper(llm)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    wrapped_embeddings = LangchainEmbeddingsWrapper(embeddings)

    metrics = [
        Faithfulness(llm=wrapped_llm),
        AnswerRelevancy(llm=wrapped_llm, embeddings=wrapped_embeddings),
        ContextPrecision(llm=wrapped_llm),
        ContextRecall(llm=wrapped_llm),
    ]

    result = evaluate(
        dataset=ragas_dataset,
        metrics=metrics,
    )

    return result.to_pandas()


def save_results(df: pd.DataFrame, output_path: str = "data/evaluation_results.csv"):
    df.to_csv(output_path, index=False, encoding="utf-8")
    
    print("MÉTRICAS RAGAs")
    metrics = ["faithfulness", "answer_relevancy",
               "context_precision", "context_recall"]

    for metric in metrics:
        if metric in df.columns:
            score = df[metric].mean()
            bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
            print(f"  {metric:<22} {bar} {score:.3f}")

    print(f"Preguntas evaluadas: {len(df)}")
    print(f"  Columnas: {list(df.columns)}")

    # Peores por faithfulness
    question_col = next(
        (c for c in ["user_input", "question", "query"] if c in df.columns),
        None
    )

    if "faithfulness" in df.columns and question_col:
        print("PREGUNTAS CON MENOR FAITHFULNESS")
        worst = df.nsmallest(3, "faithfulness")
        for _, row in worst.iterrows():
            score = row["faithfulness"]
            q = str(row[question_col])[:70]
            score_str = f"{score:.2f}" if pd.notna(score) else "N/A"
            print(f"  {score_str} | {q}")

    return question_col


def load_dataset(path: str) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    from chunking import chunk_all_documents
    from vectorstore import load_vectorstore
    from rag_chain_BM25 import build_rag_chain

    chunks = chunk_all_documents()
    vectorstore = load_vectorstore()
    chain_fn, hybrid_fn = build_rag_chain(vectorstore, chunks)

    dataset_path = "data/evaluation_dataset.json"
    print(f"Cargando dataset: {dataset_path}")
    dataset = load_dataset(dataset_path)
    print(f"  {len(dataset)} preguntas cargadas")

    print("Generando respuestas del RAG:")
    ragas_dataset = build_ragas_dataset(dataset, chain_fn, hybrid_fn)

    df_results = run_evaluation(ragas_dataset)
    save_results(df_results)