import { useState } from 'react';
import { X, Key, Globe, Search, Save } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function Settings({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useLocalStorage('openrouter_api_key', '');
  const [braveKey, setBraveKey] = useLocalStorage('brave_api_key', '');
  const [enableSearch, setEnableSearch] = useLocalStorage('enable_search', false);
  const [showKey, setShowKey] = useState(false);
  const [showBraveKey, setShowBraveKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">设置</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* OpenRouter API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4" />
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full px-3 py-2 pr-16 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              在 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">openrouter.ai/keys</a> 获取
            </p>
          </div>

          {/* 联网搜索 */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Search className="w-4 h-4" />
                联网搜索
              </label>
              <button
                onClick={() => setEnableSearch(!enableSearch)}
                className={`w-11 h-6 rounded-full transition-colors ${
                  enableSearch ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  enableSearch ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {enableSearch && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  Brave Search API Key
                </label>
                <div className="relative">
                  <input
                    type={showBraveKey ? 'text' : 'password'}
                    value={braveKey}
                    onChange={(e) => setBraveKey(e.target.value)}
                    placeholder="BSA..."
                    className="w-full px-3 py-2 pr-16 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => setShowBraveKey(!showBraveKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showBraveKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  在 <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">brave.com/search/api</a> 获取
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            {saved ? (
              <>
                <Save className="w-4 h-4" />
                已保存
              </>
            ) : (
              '保存设置'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
