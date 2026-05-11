import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import SourceBadge from "./SourceBadge"

export default function ChunkViewer({ chunks }) {
  const [open, setOpen] = useState(null)
  if (!chunks?.length) return null

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Fuentes ({chunks.length})
      </p>
      {chunks.map((chunk, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-3 py-2
                       bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                #{i + 1}
              </span>
              <SourceBadge source={chunk.source_id} />
              {chunk.titulo && (
                <span className="text-xs text-gray-500 truncate">
                  {chunk.titulo}
                </span>
              )}
            </div>
            {open === i
              ? <ChevronUp size={12} className="text-gray-400 flex-shrink-0" />
              : <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
            }
          </button>
          {open === i && (
            <div className="px-3 py-2.5 text-xs text-gray-600 leading-relaxed
                            bg-white border-t border-gray-100">
              {chunk.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}