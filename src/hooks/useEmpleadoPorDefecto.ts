import { useCallback, useState } from 'react';
import { useAsyncData } from './useAsyncData';
import { useApp } from '../context/AppContext';
import { inventarioApi } from '../services';
import { recordado } from '../lib/preferences';
import type { EmpleadoResponseDTO } from '../types/api';

/**
 * Empleado propuesto en un formulario: el del usuario que inició sesión (viene en su token) o,
 * si no es empleado, el último usado en este navegador. Se pide por id (uno solo), sin cargar
 * la lista de empleados. Devuelve el elegido y la función para cambiarlo.
 */
export function useEmpleadoPorDefecto(inicial?: number | null): [EmpleadoResponseDTO | null, (empleado: EmpleadoResponseDTO | null) => void] {
  const { user } = useApp();
  const id = inicial ?? user.idEmpleado ?? recordado('empleado');
  const cargar = useCallback(() => (id ? inventarioApi.empleados.ref(id) : Promise.resolve(null)), [id]);
  const propuesto = useAsyncData(cargar);
  // undefined = el usuario todavía no eligió: se usa el propuesto.
  const [elegido, setElegido] = useState<EmpleadoResponseDTO | null | undefined>(undefined);
  const empleado = elegido !== undefined ? elegido : propuesto.data && (propuesto.data.estado || inicial) ? propuesto.data : null;
  return [empleado, setElegido];
}
