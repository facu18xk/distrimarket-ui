import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { ModalDialog } from './ModalDialog';
import { ConfirmContext, type Confirm, type ConfirmOptions } from '../../hooks/useConfirm';

/**
 * Confirmación propia de la aplicación, en lugar del `window.confirm` del
 * navegador (que algunos entornos bloquean y no sigue el diseño).
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Dar de baja?', message: '...', danger: true }))) return;
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = (accepted: boolean) => {
    resolver.current?.(accepted);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ModalDialog isOpen={options !== null} onClose={() => answer(false)} title={options?.title ?? ''} maxWidth="sm">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            {options?.danger && (
              <div className="shrink-0 w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <p className="text-sm text-slate-600">{options?.message}</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => answer(false)}>
              Cancelar
            </Button>
            <Button variant={options?.danger ? 'destructive' : 'default'} size="sm" onClick={() => answer(true)} autoFocus>
              {options?.confirmLabel ?? 'Confirmar'}
            </Button>
          </div>
        </div>
      </ModalDialog>
    </ConfirmContext.Provider>
  );
};
