const COLORS = {
  RGPD:             "bg-blue-50 text-blue-700 border-blue-200",
  LOPDGDD:          "bg-emerald-50 text-emerald-700 border-emerald-200",
  GUIA_AEPD:        "bg-orange-50 text-orange-700 border-orange-200",
  GUIA_PD_DEFECTO:  "bg-violet-50 text-violet-700 border-violet-200",
}

export default function SourceBadge({ source }) {
  const color = COLORS[source] || "bg-gray-100 text-gray-600 border-gray-200"
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${color}`}>
      {source}
    </span>
  )
}