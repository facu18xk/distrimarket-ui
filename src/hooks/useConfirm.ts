import { createContext, useContext } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** true = acción que quita o anula algo (botón rojo). */
  danger?: boolean;
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | null>(null);

/** Pide confirmación con el diálogo de la aplicación; resuelve true si el usuario acepta. */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return confirm;
}
