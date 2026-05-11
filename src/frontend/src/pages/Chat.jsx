// src/pages/Chat.jsx

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { askQuestion } from "../services/api"
import SourceBadge from "../components/SourceBadge"
import ChunkViewer from "../components/ChunkViewer"

function Message({ msg }) {
  const isUser = msg.role === "user"
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? "bg-blue-600" : "bg-gray-800"}`}>
        {isUser
          ? <User size={16} className="text-white" />
          : <Bot size={16} className="text-white" />
        }
      </div>
      <div className={`max-w-2xl ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
          }`}>
          {msg.content}
        </div>

        {/* Fuentes usadas */}
        {msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.sources.map(s => <SourceBadge key={s} source={s} />)}
          </div>
        )}

        {/* Chunks expandibles */}
        {msg.chunks?.length > 0 && (
          <div className="w-full">
            <ChunkViewer chunks={msg.chunks} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hola, soy tu asistente jurídico especializado en protección de datos. " +
               "Puedo responder preguntas sobre el RGPD, la LOPDGDD y las guías de la AEPD. " +
               "¿En qué puedo ayudarte?",
      sources: [],
      chunks: []
    }
  ])
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)

    try {
      const { data } = await askQuestion(question)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        chunks: data.chunks,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error al conectar con el servidor. Verifica que el backend está activo.",
        sources: [],
        chunks: []
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Preguntas sugeridas
  const suggestions = [
    "¿Qué es el derecho al olvido?",
    "¿Cuándo es obligatorio designar un DPD?",
    "¿Qué multas prevé el RGPD?",
    "¿Qué es la protección de datos por defecto?",
  ]

  return (
    <div className="flex flex-col h-full">

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl
                            rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">Consultando documentos...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias — solo si no hay mensajes del usuario */}
      {messages.length === 1 && (
        <div className="px-6 pb-3 grid grid-cols-2 gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="text-left text-xs text-gray-500 bg-gray-50 hover:bg-gray-100
                         border border-gray-200 rounded-xl px-3 py-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl
                        shadow-sm px-4 py-3 focus-within:border-blue-300
                        focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta sobre RGPD, LOPDGDD o guías de la AEPD..."
            className="flex-1 resize-none text-sm text-gray-800 outline-none
                       placeholder-gray-400 bg-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200
                       rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}