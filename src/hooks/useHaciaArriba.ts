import { useLayoutEffect, useState, type RefObject } from 'react';

/** Alto aproximado de una lista desplegable abierta (búsqueda + items + paginación + pie). */
const ALTO_LISTA = 340;

/** Límites superior e inferior del contenedor con scroll más cercano o de la ventana. */
function limitesContenedor(elemento: HTMLElement): { top: number; bottom: number } {
  let actual = elemento.parentElement;
  while (actual) {
    const { overflowY, overflow } = getComputedStyle(actual);
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflow === 'auto' ||
      overflow === 'scroll'
    ) {
      const rect = actual.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }
    actual = actual.parentElement;
  }
  return { top: 0, bottom: window.innerHeight };
}

/**
 * true si la lista desplegable debe abrirse hacia arriba: cuando abajo NO entra Y arriba
 * SÍ entra con holgura. Si arriba tampoco entra, es preferible abrir hacia abajo para que
 * el buscador y los primeros resultados queden visibles inmediatamente y no se recorten
 * contra el límite superior del scroll.
 */
export function useHaciaArriba(ref: RefObject<HTMLElement | null>, abierto: boolean): boolean {
  const [haciaArriba, setHaciaArriba] = useState(false);
  useLayoutEffect(() => {
    if (!abierto || !ref.current) return;
    const caja = ref.current.getBoundingClientRect();
    const { top: limiteTop, bottom: limiteBottom } = limitesContenedor(ref.current);
    const abajo = limiteBottom - caja.bottom;
    const arriba = caja.top - limiteTop;

    // Solo abrir hacia arriba si:
    // 1. Abajo no cabe completo (< ALTO_LISTA)
    // 2. Arriba SÍ cabe (>= ALTO_LISTA)
    // 3. Hay significativamente más lugar arriba que abajo
    setHaciaArriba(abajo < ALTO_LISTA && arriba >= ALTO_LISTA && arriba > abajo);
  }, [abierto, ref]);
  return abierto && haciaArriba;
}
