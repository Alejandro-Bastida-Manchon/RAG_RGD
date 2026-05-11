// src/components/MetricGauge.jsx

const LABELS = {
  faithfulness:      "Faithfulness",
  answer_relevancy:  "Answer Relevancy",
  context_precision: "Context Precision",
  context_recall:    "Context Recall",
}

const DESCRIPTIONS = {
  faithfulness:      "¿El LLM se ciñe al contexto?",
  answer_relevancy:  "¿La respuesta responde la pregunta?",
  context_precision: "¿Los chunks recuperados son relevantes?",
  context_recall:    "¿Se recupera toda la info necesaria?",
}

const COLORS = {
  faithfulness:      "#0F6E56",
  answer_relevancy:  "#185FA5",
  context_precision: "#B85C00",
  context_recall:    "#7B4FBF",
}

function statusBadge(score) {
  if (score == null) return { label: "N/A", cls: "bg-gray-100 text-gray-500" }
  if (score >= 0.8)  return { label: "Bueno",     cls: "bg-emerald-50 text-emerald-700" }
  if (score >= 0.6)  return { label: "Mejorable", cls: "bg-amber-50 text-amber-700" }
  return               { label: "Bajo",      cls: "bg-red-50 text-red-600" }
}

export default function MetricGauge({ metric, data }) {
  const score  = data?.mean
  const color  = COLORS[metric] || "#888"
  const pct    = score != null ? Math.round(score * 100) : 0
  const badge  = statusBadge(score)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {LABELS[metric] || metric}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {DESCRIPTIONS[metric]}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between items-end">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {score != null ? score.toFixed(3) : "—"}
        </span>
        <div className="text-right text-xs text-gray-400 tabular-nums">
          <p>Min {data?.min?.toFixed(2) ?? "—"}</p>
          <p>Max {data?.max?.toFixed(2) ?? "—"}</p>
        </div>
      </div>
    </div>
  )
}