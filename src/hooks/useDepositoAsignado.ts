import { useApp } from '../context/AppContext';
import type { DepositoResponseDTO } from '../types/api';

/**
 * Depósito asignado al usuario (viene en su token). Vendedor, comprador y depositero operan
 * siempre sobre él: los formularios lo muestran fijo y el backend lo impone aunque se envíe otro.
 * Devuelve null para un ADMIN o para un empleado sin depósito asignado (esos eligen).
 */
export function useDepositoAsignado(): DepositoResponseDTO | null {
  const { user, isAdmin } = useApp();
  if (isAdmin || !user.idDeposito) return null;
  return { id: user.idDeposito, nombre: user.nombreDeposito ?? `Depósito #${user.idDeposito}`, estado: true };
}
