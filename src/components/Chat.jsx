import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MODEL_REGISTRY, THINKING_LEVELS, DEFAULT_MODEL, getModel, getEnabledModels } from '../config/models';
import { streamChat, login as apiLogin } from '../api/openrouter';
import { recordUsage, getDailyStats, getTotalStats } from '../utils/usage';

// ============ ICONS ============
const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const Icons = {
  send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  trash: (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />,
  settings: (p) => <Icon {...p} d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />,
  search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  chevDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  menu: (p) => <Icon {...p} d="M3 12h18M3 6h18M3 18h18" />,
  x: (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  image: (p) => <Icon {...p} d="M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10m18 0l-4.5-4.5a2 2 0 00-2.83 0L3 17m18-2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />,
  grid: (p) => <Icon {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  logout: (p) => <Icon {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
  paperclip: (p) => <Icon {...p} d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />,
  chart: (p) => <Icon {...p} d="M18 20V10M12 20V4M6 20v-6" />,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();

// Convert file to base64 data URL
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ MAIN APP ============
export default function App() {
  const [sessionToken, setSessionToken] = useLocalStorage('cogni-token', '');
  const [username, setUsername] = useLocalStorage('cogni-user', '');
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('cogni-logged-in', false);
  const [enabledModels, setEnabledModels] = useLocalStorage('cogni-enabled-models',
    MODEL_REGISTRY.filter(m => m.defaultEnabled).map(m => m.id)
  );
  const [conversations, setConversations] = useLocalStorage('cogni-conversations', []);
  const [activeConvId, setActiveConvId] = useLocalStorage('cogni-active-conv', null);
  const [view, setView] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [selectedModel, setSelectedModel] = useLocalStorage('cogni-model', DEFAULT_MODEL);
  const [thinkingLevel, setThinkingLevel] = useLocalStorage('cogni-thinking', 'off');
  const [searchEnabled, setSearchEnabled] = useLocalStorage('cogni-search', false);
  const [attachedImages, setAttachedImages] = useState([]); // [{name, dataUrl, type}]
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];
  const modelConfig = getModel(selectedModel);
  const enabledModelList = getEnabledModels(enabledModels);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // ============ AUTH ============
  if (!isLoggedIn) {
    return <LoginScreen onLogin={(token, user) => { setSessionToken(token); setUsername(user); setIsLoggedIn(true); }} />;
  }

  // ============ DRAG & DROP ============
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    if (!modelConfig?.supportsImages) { setError('当前模型不支持图片'); return; }
    for (const file of files.slice(0, 10)) { // max 4 images
      const dataUrl = await fileToBase64(file);
      setAttachedImages(prev => [...prev.slice(0, 9), { name: file.name, dataUrl, type: file.type }]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    for (const file of files.slice(0, 10)) {
      const dataUrl = await fileToBase64(file);
      setAttachedImages(prev => [...prev.slice(0, 9), { name: file.name, dataUrl, type: file.type }]);
    }
    e.target.value = '';
  };

  const removeImage = (idx) => setAttachedImages(prev => prev.filter((_, i) => i !== idx));

  // ============ CONVERSATION ============
  const newConversation = () => {
    const conv = { id: uid(), title: '新对话', messages: [], createdAt: now(), updatedAt: now() };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setSidebarOpen(false);
    setError(null);
    setAttachedImages([]);
  };

  const deleteConversation = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateConversation = (id, updates) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: now() } : c));
  };

  // ============ SEND ============
  const handleSend = async () => {
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return;

    let convId = activeConvId;
    let currentMessages = messages;

    if (!convId) {
      const conv = { id: uid(), title: input.slice(0, 30) || '图片对话', messages: [], createdAt: now(), updatedAt: now() };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      convId = conv.id;
      currentMessages = [];
    }

    // Build message content (text + images)
    let content;
    const images = [...attachedImages];
    if (images.length > 0) {
      content = [];
      for (const img of images) {
        content.push({
          type: 'image_url',
          image_url: { url: img.dataUrl }
        });
      }
      if (input.trim()) {
        content.push({ type: 'text', text: input.trim() });
      }
    } else {
      content = input.trim();
    }

    const userMsg = { role: 'user', content, ts: now(), images: images.length > 0 ? images.map(i => i.dataUrl) : undefined };
    const newMessages = [...currentMessages, userMsg];
    updateConversation(convId, {
      messages: newMessages,
      title: currentMessages.length === 0 ? (input.slice(0, 40) || '图片对话') : undefined
    });
    setInput('');
    setAttachedImages([]);
    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    setStreamingReasoning('');

    try {
      const thinkingParams = modelConfig?.mapThinkingParams(thinkingLevel) || {};
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      let fullContent = '';
      let fullReasoning = '';
      let usageData = null;

      for await (const chunk of streamChat(selectedModel, apiMessages, sessionToken, {
        thinkingParams, enableSearch: searchEnabled
      })) {
        const delta = chunk.choices?.[0]?.delta;
        if (chunk.usage) usageData = chunk.usage;
        if (!delta) continue;
        if (delta.content) { fullContent += delta.content; setStreamingContent(fullContent); }
        if (delta.reasoning) { fullReasoning += delta.reasoning; setStreamingReasoning(fullReasoning); }
      }

      // Record usage
      recordUsage({
        model: selectedModel,
        inputTokens: usageData?.prompt_tokens || 0,
        outputTokens: usageData?.completion_tokens || 0
      });

      updateConversation(convId, {
        messages: [...newMessages, { role: 'assistant', content: fullContent, reasoning: fullReasoning || null, ts: now() }]
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingReasoning('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Also handle paste for images
  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/'));
    if (!items.length) return;
    if (!modelConfig?.supportsImages) return;
    e.preventDefault();
    for (const item of items.slice(0, 10)) {
      const file = item.getAsFile();
      if (!file) continue;
      const dataUrl = await fileToBase64(file);
      setAttachedImages(prev => [...prev.slice(0, 9), { name: 'pasted-image', dataUrl, type: file.type }]);
    }
  };

  // ============ RENDER ============
  return (
    <div className="flex h-screen bg-white text-gray-900"
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm font-medium text-gray-700">拖放图片到这里</p>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <h1 className="text-lg font-semibold tracking-tight">Cogni</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-200 rounded">{Icons.x({})}</button>
        </div>
        <button onClick={newConversation}
          className="mx-3 mt-3 flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
          {Icons.plus({ size: 16 })} 新对话
        </button>
        <div className="flex-1 overflow-y-auto mt-2 px-2">
          {conversations.map(conv => (
            <div key={conv.id}
              onClick={() => { setActiveConvId(conv.id); setSidebarOpen(false); setView('chat'); setError(null); setAttachedImages([]); }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors mb-0.5 ${
                conv.id === activeConvId ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}>
              <span className="flex-1 truncate">{conv.title || '新对话'}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-opacity">
                {Icons.trash({ size: 14 })}
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button onClick={() => { setView('models'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${view === 'models' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            {Icons.grid({ size: 16 })} 模型库
          </button>
          <button onClick={() => { setView('usage'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${view === 'usage' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            {Icons.chart({ size: 16 })} 用量
          </button>
          <button onClick={() => { setView('settings'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${view === 'settings' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            {Icons.settings({ size: 16 })} 设置
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {view === 'models' ? (
          <ModelsView models={MODEL_REGISTRY} enabled={enabledModels} setEnabled={setEnabledModels} onBack={() => setView('chat')} />
        ) : view === 'usage' ? (
          <UsageView onBack={() => setView('chat')} />
        ) : view === 'settings' ? (
          <SettingsView username={username} onLogout={() => { setIsLoggedIn(false); setSessionToken(''); setUsername(''); }} onBack={() => setView('chat')} />
        ) : (
          <>
            {/* Header */}
            <header className="h-14 flex items-center px-4 border-b border-gray-100 gap-3 flex-shrink-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">{Icons.menu({})}</button>
              <div className="relative">
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer transition-colors outline-none">
                  {enabledModelList.map(m => (<option key={m.id} value={m.id}>{m.icon} {m.name}</option>))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">{Icons.chevDown({ size: 14 })}</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                {modelConfig?.supportsThinking && (
                  <div className="relative">
                    <select value={thinkingLevel} onChange={e => setThinkingLevel(e.target.value)}
                      className={`appearance-none rounded-lg px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer transition-colors outline-none ${
                        thinkingLevel !== 'off' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {THINKING_LEVELS.map(l => (<option key={l.value} value={l.value}>✦ {l.label}</option>))}
                    </select>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">{Icons.chevDown({ size: 12 })}</span>
                  </div>
                )}
                <button onClick={() => setSearchEnabled(!searchEnabled)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    searchEnabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {Icons.search({ size: 14 })} 搜索
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {!activeConv || messages.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                  {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                  {(streamingContent || streamingReasoning) && (
                    <Message msg={{ role: 'assistant', content: streamingContent, reasoning: streamingReasoning || null }} isStreaming />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                <p className="text-sm text-red-600 max-w-3xl mx-auto">{error}</p>
              </div>
            )}

            {/* Attached images preview */}
            {attachedImages.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
                  {attachedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.dataUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                {/* Image upload button */}
                {modelConfig?.supportsImages && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
                      {Icons.image({ size: 18 })}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  </>
                )}
                <div className="flex-1 relative">
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown} onPaste={handlePaste}
                    placeholder={attachedImages.length > 0 ? "描述这张图片..." : "输入消息..."} rows={1}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none outline-none focus:border-gray-400 focus:bg-white transition-colors text-sm leading-relaxed"
                    style={{ maxHeight: '120px', minHeight: '48px' }} />
                </div>
                <button onClick={handleSend} disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                  className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : Icons.send({ size: 18 })}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ============ LOGIN ============
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleLogin = async () => {
    if (!user.trim() || !pass.trim()) { setErr('请输入用户名和密码'); return; }
    setLoading(true); setErr('');
    try {
      const data = await apiLogin(user.trim(), pass.trim());
      onLogin(data.token, data.username);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cogni</h1>
          <p className="text-gray-500 mt-2 text-sm">AI 对话，极简体验</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)}
              placeholder="用户名" autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-400 text-sm" />
          </div>
          {err && <p className="text-red-500 text-xs">{err}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ EMPTY STATE ============
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <div className="text-5xl mb-4">✦</div>
        <p className="text-lg font-medium text-gray-500 mb-1">有什么想聊的？</p>
        <p className="text-sm">直接输入，或拖放图片开始</p>
      </div>
    </div>
  );
}

// ============ MESSAGE ============
function Message({ msg, isStreaming }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = msg.role === 'user';

  // Extract display text from content (might be array for image messages)
  const displayText = Array.isArray(msg.content)
    ? msg.content.filter(c => c.type === 'text').map(c => c.text).join('')
    : msg.content;

  const displayImages = msg.images || (
    Array.isArray(msg.content)
      ? msg.content.filter(c => c.type === 'image_url').map(c => c.image_url.url)
      : []
  );

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">C</span>
      </div>}
      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        {/* User images */}
        {isUser && displayImages.length > 0 && (
          <div className="flex gap-2 mb-2 justify-end flex-wrap">
            {displayImages.map((src, i) => (
              <img key={i} src={src} alt="" className="max-w-48 max-h-48 rounded-xl border border-gray-200 object-cover" />
            ))}
          </div>
        )}
        <div className={`inline-block text-left text-sm leading-relaxed ${
          isUser ? 'bg-gray-900 text-white px-4 py-2.5 rounded-2xl rounded-br-md' : 'text-gray-800'
        }`}>
          {!isUser && msg.reasoning && (
            <button onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors">
              <span>✦ 思考过程</span>
              <span className={`transition-transform ${showReasoning ? 'rotate-180' : ''}`}>▾</span>
            </button>
          )}
          {showReasoning && msg.reasoning && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-3 font-mono whitespace-pre-wrap border border-gray-100">
              {msg.reasoning}
            </div>
          )}
          {displayText && <div className="whitespace-pre-wrap">{displayText}{isStreaming && <span className="animate-pulse ml-0.5">▊</span>}</div>}
          {!displayText && isUser && displayImages.length > 0 && null}
        </div>
      </div>
    </div>
  );
}

// ============ MODELS VIEW ============
function ModelsView({ models, enabled, setEnabled, onBack }) {
  const toggle = (id) => {
    setEnabled(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mr-3">← 返回</button>
        <h2 className="text-base font-semibold">模型库</h2>
      </header>
      <div className="max-w-2xl mx-auto p-6 grid gap-3">
        {models.map(m => (
          <div key={m.id} onClick={() => toggle(m.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              enabled.includes(m.id) ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className="text-2xl">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.provider} · {m.description}</div>
              <div className="flex gap-2 mt-1.5">
                {m.supportsThinking && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full">思考</span>}
                {m.supportsSearch && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">搜索</span>}
                {m.supportsImages && <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">图片</span>}
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              enabled.includes(m.id) ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
              {enabled.includes(m.id) && Icons.check({ size: 12, className: 'text-white' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function SettingsView({ username, onLogout, onBack }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mr-3">← 返回</button>
        <h2 className="text-base font-semibold">设置</h2>
      </header>
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">当前用户</p>
          <p className="text-base font-medium text-gray-900 mt-1">{username}</p>
        </div>
        <hr className="border-gray-100" />
        <button onClick={onLogout}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
          {Icons.logout({ size: 16 })} 退出登录
        </button>
      </div>
    </div>
  );
}

// ============ USAGE DASHBOARD ============
function UsageView({ onBack }) {
  const stats = getTotalStats();
  const daily = getDailyStats(14); // 最近 14 天
  const maxQueries = Math.max(...daily.map(d => d.queries), 1);
  const maxTokens = Math.max(...daily.map(d => d.input + d.output), 1);

  const formatTokens = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const modelEntries = Object.entries(stats.modelBreakdown).sort((a, b) => b[1] - a[1]);
  const totalModelQueries = modelEntries.reduce((s, [, v]) => s + v, 0) || 1;
  const barColors = ['bg-gray-900', 'bg-gray-600', 'bg-gray-400', 'bg-gray-300', 'bg-gray-200'];

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mr-3">← 返回</button>
        <h2 className="text-base font-semibold">用量统计</h2>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="今日" queries={stats.today.queries} tokens={stats.today.input + stats.today.output} formatTokens={formatTokens} />
          <StatCard label="本周" queries={stats.week.queries} tokens={stats.week.input + stats.week.output} formatTokens={formatTokens} />
          <StatCard label="总计" queries={stats.all.queries} tokens={stats.all.input + stats.all.output} formatTokens={formatTokens} />
        </div>

        {/* Daily queries chart */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">每日对话量</h3>
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative group">
                  <div className="w-full bg-gray-900 rounded-t transition-all"
                    style={{ height: `${Math.max((d.queries / maxQueries) * 120, d.queries > 0 ? 4 : 0)}px` }} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {d.date}: {d.queries}次 / {formatTokens(d.input + d.output)} tokens
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-gray-400 truncate w-full text-center">{i % 2 === 0 ? d.date : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily tokens chart */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">每日 Token 用量</h3>
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => {
              const total = d.input + d.output;
              const inputRatio = total > 0 ? d.input / total : 0;
              const barH = Math.max((total / maxTokens) * 120, total > 0 ? 4 : 0);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative group">
                    <div className="w-full rounded-t overflow-hidden flex flex-col-reverse" style={{ height: `${barH}px` }}>
                      <div className="w-full bg-gray-400" style={{ height: `${(1 - inputRatio) * 100}%` }} />
                      <div className="w-full bg-gray-900" style={{ height: `${inputRatio * 100}%` }} />
                    </div>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        {d.date}: 输入 {formatTokens(d.input)} / 输出 {formatTokens(d.output)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">{i % 2 === 0 ? d.date : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-900 rounded-sm" /> 输入</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-sm" /> 输出</span>
          </div>
        </div>

        {/* Model breakdown */}
        {modelEntries.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">模型使用分布</h3>
            <div className="space-y-2.5">
              {modelEntries.slice(0, 6).map(([model, count], i) => (
                <div key={model}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{model}</span>
                    <span className="text-gray-400">{count} 次 · {Math.round(count / totalModelQueries * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${barColors[Math.min(i, barColors.length - 1)]} transition-all`}
                      style={{ width: `${(count / totalModelQueries) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.all.queries === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm">还没有使用记录</p>
            <p className="text-xs mt-1">开始对话后这里会显示用量统计</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, queries, tokens, formatTokens }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{queries}</p>
      <p className="text-[10px] text-gray-400 mt-1">{formatTokens(tokens)} tokens</p>
    </div>
  );
}
