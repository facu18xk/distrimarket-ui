import React from 'react';
import { ErrorPage } from './ErrorPage';

export interface UnauthorizedPageProps {
  /** Título personalizado (opcional). */
  title?: string;
  /** Mensaje descriptivo personalizado (opcional). */
  message?: string;
  /** Detalle adicional (por ejemplo, motivo devuelto por el servidor). */
  detail?: string | null;
  /** Callback para iniciar sesión o ir a la vista de login. */
  onLogin?: () => void;
  /** Callback para cerrar sesión o cambiar de cuenta. */
  onLogout?: () => void;
  /** Callback para ir a la pantalla de inicio. */
  onHome?: () => void;
  /** Callback para reintentar la acción. */
  onRetry?: () => void;
  /** Elementos o botones de acción adicionales. */
  actions?: React.ReactNode;
}

/**
 * Pantalla de error 401: Acceso no autorizado / sesión expirada o requerida.
 */
export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  title,
  message,
  detail,
  onLogin,
  onLogout,
  onHome,
  onRetry,
  actions,
}) => (
  <ErrorPage
    code={401}
    title={title}
    message={message}
    detail={detail}
    onLogin={onLogin}
    onLogout={onLogout}
    onHome={onHome}
    onRetry={onRetry}
    actions={actions}
  />
);
