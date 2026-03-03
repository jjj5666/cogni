import { useState } from 'react';
import { getModelList } from '../config/models';
import { ChevronDown, Cpu } from 'lucide-react';

export function ModelSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const models = getModelList();
  const selected = models.find(m => m.key === value) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-sm"
      >
        <Cpu className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{selected.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {models.map(model => (
              <button
                key={model.key}
                onClick={() => {
                  onChange(model.key);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  model.key === value ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
