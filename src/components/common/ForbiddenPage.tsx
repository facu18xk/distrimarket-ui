import React from 'react';
import { ErrorPage } from './ErrorPage';

export interface ForbiddenPageProps {
  /** Título personalizado (opcional). */
  title?: string;
  /** Mensaje descriptivo personalizado (opcional). */
  message?: string;
  /** Módulo o recurso al que se intentó acceder (por ejemplo: 'administracion', 'compras'). */
  modulo?: string;
  /** Detalle adicional (por ejemplo, roles necesarios o mensaje técnico). */
  detail?: string | null;
  /** Callback para ir a la pantalla de inicio permitida. */
  onHome?: () => void;
  /** Callback para cerrar sesión o cambiar de cuenta. */
  onLogout?: () => void;
  /** Callback para iniciar sesión con otra cuenta. */
  onLogin?: () => void;
  /** Callback para reintentar la acción. */
  onRetry?: () => void;
  /** Elementos o botones de acción adicionales. */
  actions?: React.ReactNode;
}

/**
 * Pantalla de error 403: Acceso denegado / permisos insuficientes para el recurso o módulo.
 */
export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  title,
  message,
  modulo,
  detail,
  onHome,
  onLogout,
  onLogin,
  onRetry,
  actions,
}) => {
  const detalleFinal = detail ?? (modulo ? `Módulo restringido: ${modulo}` : null);
  return (
    <ErrorPage
      code={403}
      title={title}
      message={message}
      detail={detalleFinal}
      onHome={onHome}
      onLogout={onLogout}
      onLogin={onLogin}
      onRetry={onRetry}
      actions={actions}
    />
  );
};
