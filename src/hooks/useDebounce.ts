import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value (e.g. search input for backend API queries)
 * @param value The value to debounce
 * @param delay Delay in milliseconds (defaults to 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
