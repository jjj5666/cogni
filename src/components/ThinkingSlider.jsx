import { THINKING_OPTIONS } from '../config/models';
import { Brain } from 'lucide-react';

export function ThinkingSlider({ value, onChange }) {
  const currentIndex = THINKING_OPTIONS.findIndex(o => o.value === value);
  
  return (
    <div className="flex items-center gap-3">
      <Brain className="w-4 h-4 text-gray-500" />
      <div className="flex-1">
        <div className="flex gap-1">
          {THINKING_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex-1 h-8 text-xs font-medium rounded transition-all ${
                index === currentIndex
                  ? 'bg-blue-500 text-white'
                  : index < currentIndex
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={`${option.label}: ${option.description}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
