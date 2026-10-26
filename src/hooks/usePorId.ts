import { useEffect, useMemo, useState } from 'react';
import { enTandas } from '../lib/tandas';

/**
 * Datos de otro recurso para los ids que aparecen en pantalla (por ejemplo, el nombre del
 * vendedor de cada factura de la página). Cada id distinto se pide una sola vez, aunque
 * aparezca en varias filas: 10 facturas del mismo vendedor generan un solo pedido.
 *
 * No se guarda en el navegador: lo que dura es mientras la pantalla está abierta. El backend
 * lo responde desde su caché (Redis), así que pedirlo de nuevo es barato y se ve en Redis.
 *
 * `buscar` debe ser estable (los métodos `ref` de los servicios lo son). Si un id falla
 * (dado de baja, sin permiso), queda como `null` y la pantalla muestra "—".
 */
export function usePorId<T>(buscar: (id: number) => Promise<T>, ids: (number | null | undefined)[]): Map<number, T | null> {
  const [encontrados, setEncontrados] = useState<Map<number, T | null>>(() => new Map());
  const clave = useMemo(
    () => [...new Set(ids.filter((id): id is number => typeof id === 'number' && id > 0))].sort((a, b) => a - b).join(','),
    [ids]
  );

  useEffect(() => {
    const faltantes = clave
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((id) => !encontrados.has(id));
    if (faltantes.length === 0) return;
    let cancelado = false;
    // Pocos pedidos a la vez para no saturar al microservicio; si uno falla, se reintenta una vez.
    const conReintento = (id: number) => buscar(id).catch(() => buscar(id));
    enTandas(faltantes, conReintento).then((resultados) => {
      if (cancelado) return;
      setEncontrados((actual) => {
        const nuevo = new Map(actual);
        resultados.forEach(([id, dato]) => nuevo.set(id, dato));
        return nuevo;
      });
    });
    return () => {
      cancelado = true;
    };
    // `encontrados` se lee solo para no repetir pedidos; no debe disparar una nueva búsqueda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, clave]);

  return encontrados;
}
