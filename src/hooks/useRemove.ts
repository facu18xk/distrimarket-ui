import { useCallback } from 'react';
import { useAsyncAction } from './useAsyncAction';
import { useConfirm, type ConfirmOptions } from './useConfirm';

/**
 * Acción "quitar" de una tabla: confirma, llama al DELETE (borrado lógico en
 * el backend) y recarga el listado. `error` trae el mensaje del backend si falla.
 */
export function useRemove(onDone: () => void) {
  const confirm = useConfirm();
  const action = useAsyncAction();
  const { run } = action;

  const remove = useCallback(
    async (options: Omit<ConfirmOptions, 'danger'>, operation: () => Promise<unknown>) => {
      if (!(await confirm({ confirmLabel: 'Dar de baja', ...options, danger: true }))) return;
      if (await run(operation)) onDone();
    },
    [confirm, run, onDone]
  );

  return { remove, error: action.error, loading: action.loading, clearError: action.clearError };
}
