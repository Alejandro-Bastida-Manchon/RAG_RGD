// src/App.jsx

import { useState } from "react"
import { MessageSquare, BarChart2, Activity, Scale } from "lucide-react"
import Chat from "./pages/Chat"
import Dashboard from "./pages/Dashboard"
import RealtimeEval from "./pages/RealtimeEval"

const NAV = [
  { id: "chat",      label: "Asistente",        icon: MessageSquare },
  { id: "dashboard", label: "Evaluación Test",   icon: BarChart2 },
  { id: "realtime",  label: "Evaluación Live",   icon: Activity },
]

export default function App() {
  const [page, setPage] = useState("chat")

  return (
    <div className="flex h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-52 bg-gray-900 flex flex-col py-5 px-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 mb-7">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Scale size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">RAG Legal</p>
            <p className="text-gray-500 text-xs">RGPD · LOPDGDD</p>
          </div>
        </div>

        <nav className="space-y-0.5 flex-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                text-sm font-medium transition-colors
                ${page === id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-2 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">v1.0.0 · Mistral + RAGAs</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center
                           px-5 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">
            {NAV.find(n => n.id === page)?.label}
          </h2>
        </header>
        <div className="flex-1 overflow-hidden">
          {page === "chat"      && <Chat />}
          {page === "dashboard" && <Dashboard />}
          {page === "realtime"  && <RealtimeEval />}
        </div>
      </main>
    </div>
  )
}