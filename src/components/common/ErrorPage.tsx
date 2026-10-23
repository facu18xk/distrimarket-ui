import React from 'react';
import { Home, RefreshCw, SearchX, ServerCrash } from 'lucide-react';
import { Button } from '../ui/button';

interface ErrorPageProps {
  code: 404 | 500;
  /** Detalle opcional (por ejemplo, el mensaje del backend). */
  detail?: string | null;
  onHome?: () => void;
  onRetry?: () => void;
}

const TEXTOS = {
  404: {
    icono: SearchX,
    titulo: 'Página no encontrada',
    mensaje: 'La dirección que buscás no existe o se movió. Revisá el enlace o volvé al inicio.',
  },
  500: {
    icono: ServerCrash,
    titulo: 'Algo salió mal',
    mensaje: 'El servidor no pudo completar el pedido. Puede ser una falla momentánea: intentá de nuevo en unos segundos.',
  },
} as const;

/** Página amigable para los errores críticos: 404 (no encontrado) y 500 (error del servidor). */
export const ErrorPage: React.FC<ErrorPageProps> = ({ code, detail, onHome, onRetry }) => {
  const { icono: Icono, titulo, mensaje } = TEXTOS[code];
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
          <Icono className="w-7 h-7" />
        </div>
        <p className="text-5xl font-black text-slate-900 tracking-tight">{code}</p>
        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
        <p className="text-sm text-slate-500">{mensaje}</p>
        {detail && <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">{detail}</p>}
        <div className="flex items-center justify-center gap-2 pt-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw />
              <span>Reintentar</span>
            </Button>
          )}
          {onHome && (
            <Button onClick={onHome}>
              <Home />
              <span>Ir al inicio</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
