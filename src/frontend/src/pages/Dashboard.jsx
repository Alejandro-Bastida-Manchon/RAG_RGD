// src/pages/Dashboard.jsx

import { useEffect, useState } from "react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, Legend
} from "recharts"
import { getMetricsSummary, getMetricsDetail, getWorstQuestions } from "../services/api"
import MetricGauge from "../components/MetricGauge"
import { AlertTriangle, TrendingUp } from "lucide-react"

const METRIC_COLORS = {
  faithfulness:      "#0F6E56",
  answer_relevancy:  "#185FA5",
  context_precision: "#B85C00",
  context_recall:    "#7B4FBF",
}

const METRIC_LABELS = {
  faithfulness:      "Faithfulness",
  answer_relevancy:  "Answer Relevancy",
  context_precision: "Context Precision",
  context_recall:    "Context Recall",
}

export default function Dashboard() {
  const [summary, setSummary]   = useState(null)
  const [detail, setDetail]     = useState(null)
  const [worst, setWorst]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, d, w] = await Promise.all([
          getMetricsSummary(),
          getMetricsDetail(),
          getWorstQuestions("faithfulness", 3),
        ])
        setSummary(s.data)
        setDetail(d.data)
        setWorst(w.data)
      } catch (e) {
        setError("No se pudieron cargar los datos. Ejecuta evaluation.py primero.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Cargando métricas...
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <AlertTriangle className="text-amber-400" size={32} />
      <p className="text-gray-500 text-sm">{error}</p>
    </div>
  )

  // Datos para el radar
  const radarData = Object.entries(summary.metrics).map(([key, val]) => ({
    metric: METRIC_LABELS[key] || key,
    score: val.mean,
  }))

  // Datos para el bar chart por pregunta
  const metricKeys = Object.keys(METRIC_LABELS)
  const barData = detail.questions.map((q, i) => ({
    name: `P${i + 1}`,
    question: q.question,
    ...Object.fromEntries(
      metricKeys.map(k => [k, q.metrics[k] ?? 0])
    )
  }))

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Evaluación RAGAs
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {summary.total_questions} preguntas evaluadas ·
            RGPD + LOPDGDD + Guías AEPD
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700
                        px-3 py-1.5 rounded-xl text-xs font-semibold">
          <TrendingUp size={14} />
          Pipeline activo
        </div>
      </div>

      {/* Gauges — 4 métricas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(summary.metrics).map(([metric, data]) => (
          <MetricGauge key={metric} metric={metric} data={data} />
        ))}
      </div>

      {/* Radar + Worst */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Radar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Radar de métricas
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 11, fill: "#888" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#185FA5"
                fill="#185FA5"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Peores preguntas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            Preguntas con menor faithfulness
          </p>
          <div className="space-y-3">
            {worst.worst.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  flex-shrink-0 text-sm font-bold
                  ${item.score >= 0.8 ? "bg-emerald-50 text-emerald-600"
                    : item.score >= 0.6 ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-500"}`}>
                  {item.score?.toFixed(2) ?? "—"}
                </div>
                <p className="text-sm text-gray-600 leading-snug pt-1">
                  {item.question}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart por pregunta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">
          Scores por pregunta
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#aaa" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 11, fill: "#aaa" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(val, name) => [
                val?.toFixed(3) ?? "N/A",
                METRIC_LABELS[name] || name
              ]}
              labelFormatter={label => {
                const q = barData.find(d => d.name === label)
                return q?.question?.slice(0, 60) + "..." || label
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
                fontSize: "12px"
              }}
            />
            <Legend
              formatter={name => METRIC_LABELS[name] || name}
              wrapperStyle={{ fontSize: "11px" }}
            />
            {metricKeys.map(k => (
              <Bar key={k} dataKey={k} fill={METRIC_COLORS[k]}
                   radius={[4, 4, 0, 0]} maxBarSize={18} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}