import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStored = useCallback((v) => {
    const next = v instanceof Function ? v(value) : v;
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, value]);

  return [value, setStored];
}
