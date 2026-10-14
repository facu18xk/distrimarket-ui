import { useCallback, useState } from 'react';
import { errorMessage } from '../services/http';

export interface AsyncAction {
  /** Ejecuta la operación; devuelve true si terminó bien. */
  run: (operation: () => Promise<unknown>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Envoltorio para guardar, anular o borrar: maneja el "guardando..." y deja el
 * mensaje del backend (409, 422, 503...) listo para mostrar.
 */
export function useAsyncAction(): AsyncAction {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await operation();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, loading, error, clearError };
}
