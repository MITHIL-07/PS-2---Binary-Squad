import { useEffect, useRef } from 'react'
import { Bot, User, Zap } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gray-700' : 'bg-blue-600'
      }`}>
        {isUser ? <User size={16} className="text-gray-300" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>

        {/* Intent badge */}
        {msg.tool_used && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2.5 py-1">
            <Zap size={10} />
            <span>{msg.tool_used.replace('_', ' ')} detected</span>
          </div>
        )}

        {/* Tool result */}
        {msg.tool_result && (
          <div className="text-xs bg-green-400/10 border border-green-400/20 text-green-300 rounded-xl px-3 py-2 whitespace-pre-wrap max-w-full">
            {msg.tool_result}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatBox({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1 px-4 py-4">
      {messages.map((msg, i) => (
        <Message key={i} msg={msg} />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}