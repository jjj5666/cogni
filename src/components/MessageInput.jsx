import { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Settings } from 'lucide-react';

export function MessageInput({ 
  onSend, 
  onStop, 
  isStreaming, 
  onOpenSettings,
  disabled 
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? '请先设置 API Key' : '输入消息... (Shift+Enter 换行)'}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 text-gray-700 placeholder-gray-400 disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
          
          <div className="flex items-center gap-1 pb-1">
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {isStreaming ? (
              <button
                onClick={onStop}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="停止"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-lg transition-colors"
                title="发送"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-2">
          AI 生成的内容可能有误，请自行核实
        </p>
      </div>
    </div>
  );
}
