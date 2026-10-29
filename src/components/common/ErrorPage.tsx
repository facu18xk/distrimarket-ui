import React from 'react';
import { Home, LogIn, LogOut, RefreshCw, SearchX, ServerCrash, ShieldAlert, ShieldBan } from 'lucide-react';
import { Button } from '../ui/button';

export type ErrorCode = 401 | 403 | 404 | 500;

export interface ErrorPageProps {
  code: ErrorCode;
  /** Título personalizado (opcional, reemplaza el predeterminado). */
  title?: string;
  /** Mensaje descriptivo (opcional, reemplaza el predeterminado). */
  message?: string;
  /** Detalle opcional (por ejemplo, el mensaje del backend o la causa técnica). */
  detail?: string | null;
  /** Acción para volver al inicio. */
  onHome?: () => void;
  /** Acción para reintentar la operación. */
  onRetry?: () => void;
  /** Acción para iniciar sesión (útil en 401). */
  onLogin?: () => void;
  /** Acción para cerrar sesión o cambiar de cuenta (útil en 403 o 401). */
  onLogout?: () => void;
  /** Botones o elementos de acción adicionales. */
  actions?: React.ReactNode;
}

const TEXTOS: Record<
  ErrorCode,
  {
    icono: React.ComponentType<{ className?: string }>;
    titulo: string;
    mensaje: string;
    badgeClass: string;
  }
> = {
  401: {
    icono: ShieldAlert,
    titulo: 'Acceso no autorizado',
    mensaje: 'No tenés una sesión activa o tus credenciales han expirado. Iniciá sesión nuevamente para continuar.',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
  },
  403: {
    icono: ShieldBan,
    titulo: 'Acceso denegado',
    mensaje: 'No contás con los permisos necesarios para acceder a esta sección o recurso. Si creés que es un error, contactá a un administrador.',
    badgeClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
  },
  404: {
    icono: SearchX,
    titulo: 'Página no encontrada',
    mensaje: 'La dirección que buscás no existe o se movió. Revisá el enlace o volvé al inicio.',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
  },
  500: {
    icono: ServerCrash,
    titulo: 'Algo salió mal',
    mensaje: 'El servidor no pudo completar el pedido. Puede ser una falla momentánea: intentá de nuevo en unos segundos.',
    badgeClass: 'bg-red-50 text-red-600 border-red-200/80',
  },
};

/**
 * Pantalla amigable para errores HTTP críticos:
 * - 401: No autorizado / sesión expirada
 * - 403: Acceso denegado / permisos insuficientes
 * - 404: Página no encontrada
 * - 500: Falla en el servidor
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({
  code,
  title,
  message,
  detail,
  onHome,
  onRetry,
  onLogin,
  onLogout,
  actions,
}) => {
  const config = TEXTOS[code];
  const Icono = config.icono;
  const tituloFinal = title ?? config.titulo;
  const mensajeFinal = message ?? config.mensaje;

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[50vh]">
      <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div
          className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs ${config.badgeClass}`}
        >
          <Icono className="w-7 h-7" />
        </div>
        <p className="text-5xl font-black text-slate-900 tracking-tight">{code}</p>
        <h2 className="text-lg font-bold text-slate-900">{tituloFinal}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{mensajeFinal}</p>
        {detail && (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 font-mono text-left break-words">
            {detail}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw />
              <span>Reintentar</span>
            </Button>
          )}
          {onLogin && (
            <Button onClick={onLogin}>
              <LogIn />
              <span>Iniciar sesión</span>
            </Button>
          )}
          {onHome && (
            <Button onClick={onHome} variant={onLogin ? 'outline' : 'default'}>
              <Home />
              <span>Ir al inicio</span>
            </Button>
          )}
          {onLogout && (
            <Button variant="outline" onClick={onLogout}>
              <LogOut />
              <span>Cerrar sesión</span>
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
};
