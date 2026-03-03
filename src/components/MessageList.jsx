import { useState, useRef, useEffect } from 'react';
import { Send, Square, Bot, User, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { formatTime, copyToClipboard } from '../utils/format';

function MessageContent({ content }) {
  const [copied, setCopied] = useState(false);
  
  // 简单的代码块检测
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  const handleCopy = async (text) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // 代码块
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <div key={index} className="relative group">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-t-lg">
                  <span>{lang || 'code'}</span>
                  <button
                    onClick={() => handleCopy(code.trim())}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 overflow-x-auto text-sm rounded-b-lg">
                  <code>{code.trim()}</code>
                </pre>
              </div>
            );
          }
        }
        
        // 普通文本
        return (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </p>
        );
      })}
    </div>
  );
}

function ReasoningBlock({ reasoning }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!reasoning) return null;
  
  return (
    <div className="mb-2 bg-amber-50 border border-amber-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <span className="font-medium">思考过程</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 text-xs text-amber-800/80 whitespace-pre-wrap font-mono">
          {reasoning}
        </div>
      )}
    </div>
  );
}

export function MessageList({ messages, isStreaming }) {
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>开始你的对话</p>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}>
                {msg.role === 'assistant' && msg.reasoning && (
                  <ReasoningBlock reasoning={msg.reasoning} />
                )}
                <MessageContent content={msg.content} />
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))
      )}
      
      {isStreaming && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-gray-600" />
          </div>
          <div className="bg-gray-100 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
