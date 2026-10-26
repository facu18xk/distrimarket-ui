/**
 * Valores que el usuario elige casi siempre igual (su depósito, su nombre como
 * responsable). Se recuerdan en el navegador para proponerlos ya elegidos y
 * que cargar una operación sea rápido.
 *
 * PROVISORIO: cuando el backend asocie cada empleado a su sucursal y exista
 * autenticación real, estos valores saldrán del usuario que inició sesión.
 */
type PreferenceKey = 'deposito' | 'empleado';

const storageKey = (key: PreferenceKey) => `distrimarket_pref_${key}`;

export function rememberId(key: PreferenceKey, id: number | ''): void {
  if (id !== '') localStorage.setItem(storageKey(key), String(id));
}

/** El recordado si sigue disponible; si no, el primero de la lista. */
export function preferredId(key: PreferenceKey, available: number[]): number | '' {
  const saved = Number(localStorage.getItem(storageKey(key)));
  if (saved && available.includes(saved)) return saved;
  return available[0] ?? '';
}

/**
 * Empleado propuesto en un formulario: el del usuario que inició sesión (viene en su token)
 * si figura en la lista; si no, el último usado.
 */
export function empleadoPorDefecto(idPropio: number | undefined, available: number[]): number | '' {
  return idPropio && available.includes(idPropio) ? idPropio : preferredId('empleado', available);
}

/** Id recordado en este navegador (o '' si no hay). */
export function recordado(key: PreferenceKey): number | '' {
  const saved = Number(localStorage.getItem(storageKey(key)));
  return saved > 0 ? saved : '';
}
