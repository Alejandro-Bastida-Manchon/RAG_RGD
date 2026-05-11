# backend/routers/metrics.py

import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

RESULTS_PATH = os.path.join("data", "evaluation_results.csv")

def load_results() -> pd.DataFrame:
    if not os.path.exists(RESULTS_PATH):
        raise HTTPException(
            status_code=404,
            detail="No hay resultados actualmente de evaluación."
        )
    return pd.read_csv(RESULTS_PATH)


@router.get("/metrics/summary")
def get_metrics_summary():
    df = load_results()

    metric_cols = ["faithfulness", "answer_relevancy",
                   "context_precision", "context_recall"]

    summary = {}
    for metric in metric_cols:
        if metric in df.columns:
            values = df[metric].dropna()
            summary[metric] = {
                "mean": round(float(values.mean()), 3),
                "min": round(float(values.min()), 3),
                "max": round(float(values.max()), 3),
                "std": round(float(values.std()), 3),
            }

    return {
        "total_questions": len(df),
        "metrics": summary
    }


@router.get("/metrics/detail")
def get_metrics_detail():
    df = load_results()

    metric_cols = ["faithfulness", "answer_relevancy",
                   "context_precision", "context_recall"]

    question_col = next(
        (c for c in ["user_input", "question", "query"] if c in df.columns),
        None
    )

    results = []
    for _, row in df.iterrows():
        item = {
            "question": str(row[question_col])[:100] if question_col else "N/A",
            "metrics": {}
        }
        for metric in metric_cols:
            if metric in df.columns:
                val = row[metric]
                item["metrics"][metric] = round(float(val), 3) if pd.notna(val) else None
        results.append(item)

    return {"questions": results}


@router.get("/metrics/worst")
def get_worst_questions(metric: str = "faithfulness", n: int = 3):
    df = load_results()

    if metric not in df.columns:
        raise HTTPException(status_code=400, detail=f"Métrica '{metric}' no encontrada.")

    question_col = next(
        (c for c in ["user_input", "question", "query"] if c in df.columns),
        None
    )

    worst = df.nsmallest(n, metric)
    results = []
    for _, row in worst.iterrows():
        results.append({
            "question": str(row[question_col])[:100] if question_col else "N/A",
            "score": round(float(row[metric]), 3) if pd.notna(row[metric]) else None
        })

    return {"metric": metric, "worst": results}