import { useState } from 'react'
import { Send, Bot } from 'lucide-react'
import { sendAgentMessage } from '../api/client'
import toast from 'react-hot-toast'

const SESSION_KEY = 'geospatial_session_id'

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `session_${Date.now()}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I am GeoBot. How can I help you?' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const { data } = await sendAgentMessage(text, history, getSessionId())
      setMessages((prev) => [...prev, {
        role:        'assistant',
        content:     data.reply || 'Sorry, I could not process that.',
        tool_used:   data.tool_used,
        tool_result: data.tool_result,
      }])
    } catch {
      toast.error('Failed to connect to GeoBot')
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Connection failed. Is the backend running?' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">GeoBot</p>
          <p className="text-xs text-green-400">Online · LLaMA3 70B</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-blue-600'}`}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="max-w-[75%] flex flex-col gap-1">
              <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                {msg.content}
              </div>
              {msg.tool_result && (
                <div className="text-xs bg-green-400/10 border border-green-400/20 text-green-300 rounded-xl px-3 py-2">
                  {msg.tool_result}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask GeoBot about locations..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}