import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../services/http';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Respuesta (o error) de una carga, junto con la carga a la que pertenece. */
interface Settled<T> {
  request: object | null;
  data: T | null;
  error: string | null;
}

/**
 * Carga un dato del backend una vez (catálogos para selectores, un reporte).
 * `loader` debe ser estable entre renders: una función de módulo o un useCallback.
 * Al cambiar `loader` se vuelve a cargar.
 */
export function useAsyncData<T>(loader: () => Promise<T>, enabled = true): AsyncData<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ request: null, data: null, error: null });

  // Identifica la carga vigente: cambia con el loader o con cada "reintentar".
  const [request, setRequest] = useState<{ loader: () => Promise<T>; version: number }>({ loader, version });
  if (request.loader !== loader || request.version !== version) {
    setRequest({ loader, version });
  }

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    request
      .loader()
      .then((data) => {
        if (!cancelled) setSettled({ request, data, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setSettled((previous) => ({ request, data: previous.data, error: errorMessage(e) }));
      });
    return () => {
      cancelled = true;
    };
  }, [request, enabled]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = settled.request === request;

  return {
    data: settled.data,
    loading: enabled && !current,
    error: current ? settled.error : null,
    reload,
  };
}
