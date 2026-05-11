// src/pages/RealtimeEval.jsx

import { useEffect, useState } from "react"
import { getRealtimeEvals, clearRealtimeEvals } from "../services/api"
import { RefreshCw, Trash2, Activity, Clock } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts"

function ScorePill({ value }) {
  if (value == null) return <span className="text-gray-300 text-xs">—</span>
  const color = value >= 0.8
    ? "text-emerald-600 bg-emerald-50"
    : value >= 0.6
    ? "text-amber-600 bg-amber-50"
    : "text-red-600 bg-red-50"
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${color}`}>
      {value.toFixed(3)}
    </span>
  )
}

export default function RealtimeEval() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await getRealtimeEvals()
      setData(res.data.evaluations.reverse()) // más recientes primero
    } catch { setData([]) }
    finally { setLoading(false) }
  }

  async function handleClear() {
    setClearing(true)
    await clearRealtimeEvals()
    setData([])
    setClearing(false)
  }

  useEffect(() => { load() }, [])

  // Datos para el gráfico de evolución temporal
  const chartData = [...data].reverse().map((e, i) => ({
    idx: `#${i + 1}`,
    faithfulness:     e.faithfulness,
    answer_relevancy: e.answer_relevancy,
  }))

  const avg = (key) => {
    const vals = data.filter(d => d[key] != null).map(d => d[key])
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3) : "—"
  }

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            Evaluación en tiempo real
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Faithfulness y Answer Relevancy evaluados tras cada consulta
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600
                       border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50
                       transition-colors"
          >
            <RefreshCw size={12} /> Actualizar
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || !data.length}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600
                       border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50
                       transition-colors disabled:opacity-40"
          >
            <Trash2 size={12} /> Limpiar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Consultas evaluadas", value: data.length, unit: "" },
          { label: "Faithfulness medio",  value: avg("faithfulness"), unit: "" },
          { label: "Answer Rel. medio",   value: avg("answer_relevancy"), unit: "" },
        ].map(({ label, value }) => (
          <div key={label}
               className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico evolución */}
      {chartData.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Evolución por consulta
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="idx"
                     tick={{ fontSize: 11, fill: "#aaa" }}
                     axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]}
                     tick={{ fontSize: 11, fill: "#aaa" }}
                     axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="faithfulness"
                    stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }}
                    name="Faithfulness" />
              <Line type="monotone" dataKey="answer_relevancy"
                    stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }}
                    name="Answer Relevancy" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de consultas */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Historial de consultas
          </p>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Cargando...
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Aún no hay consultas evaluadas. Haz una pregunta en el Asistente.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">#</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Pregunta</th>
                <th className="text-center px-4 py-2.5 text-gray-400 font-medium">Faithfulness</th>
                <th className="text-center px-4 py-2.5 text-gray-400 font-medium">Answer Rel.</th>
                <th className="text-right px-4 py-2.5 text-gray-400 font-medium">
                  <Clock size={10} className="inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 tabular-nums">
                    {data.length - i}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <p className="truncate">{entry.question}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={entry.faithfulness} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScorePill value={entry.answer_relevancy} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}