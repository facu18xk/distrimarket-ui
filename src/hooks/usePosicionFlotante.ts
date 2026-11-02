import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/** Alto que suele necesitar una lista desplegable abierta (búsqueda + items + paginación + pie). */
const ALTO_DESEADO = 340;
const MARGEN = 8;

/**
 * Posición de una lista desplegable respecto de la ventana (position: fixed), no del contenedor.
 * Así la lista se ve entera aunque el campo esté al fondo de un modal con scroll: sobresale del
 * modal en vez de quedar cortada. Se abre hacia abajo; hacia arriba solo si abajo no entra y
 * arriba hay más lugar. Se reubica al hacer scroll o cambiar el tamaño de la ventana.
 *
 * Requiere que ningún contenedor tenga transform/translate/filter (el modal se centra sin transform).
 */
export function usePosicionFlotante(ancla: RefObject<HTMLElement | null>, abierto: boolean): CSSProperties | undefined {
  const [estilo, setEstilo] = useState<CSSProperties>();

  useLayoutEffect(() => {
    if (!abierto) return;
    const ubicar = () => {
      const caja = ancla.current?.getBoundingClientRect();
      if (!caja) return;
      const abajo = window.innerHeight - caja.bottom - MARGEN;
      const arriba = caja.top - MARGEN;
      const haciaArriba = abajo < ALTO_DESEADO && arriba > abajo;
      setEstilo({
        position: 'fixed',
        left: Math.max(MARGEN, Math.min(caja.left, window.innerWidth - caja.width - MARGEN)),
        minWidth: caja.width,
        maxWidth: window.innerWidth - 2 * MARGEN,
        maxHeight: Math.max(160, haciaArriba ? arriba - 4 : abajo - 4),
        overflowY: 'auto',
        zIndex: 60,
        ...(haciaArriba ? { bottom: window.innerHeight - caja.top + 4 } : { top: caja.bottom + 4 }),
      });
    };
    ubicar();
    // Scroll de cualquier contenedor (captura) o de la ventana, y cambio de tamaño.
    window.addEventListener('scroll', ubicar, true);
    window.addEventListener('resize', ubicar);
    return () => {
      window.removeEventListener('scroll', ubicar, true);
      window.removeEventListener('resize', ubicar);
    };
  }, [abierto, ancla]);

  return abierto ? estilo : undefined;
}
