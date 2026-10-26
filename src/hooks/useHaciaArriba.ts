import { useLayoutEffect, useState, type RefObject } from 'react';

/** Alto aproximado de una lista desplegable abierta. */
const ALTO_LISTA = 300;

/** El contenedor con scroll más cercano (el cuerpo de un modal) o la ventana. */
function limiteInferior(elemento: HTMLElement): number {
  let actual = elemento.parentElement;
  while (actual) {
    const { overflowY } = getComputedStyle(actual);
    if (overflowY === 'auto' || overflowY === 'scroll') return actual.getBoundingClientRect().bottom;
    actual = actual.parentElement;
  }
  return window.innerHeight;
}

/**
 * true si la lista desplegable debe abrirse hacia arriba: cuando abajo no entra (por ejemplo,
 * la última fila de un modal) y arriba hay más lugar. Así abrirla no agrega scroll.
 */
export function useHaciaArriba(ref: RefObject<HTMLElement | null>, abierto: boolean): boolean {
  const [haciaArriba, setHaciaArriba] = useState(false);
  useLayoutEffect(() => {
    if (!abierto || !ref.current) return;
    const caja = ref.current.getBoundingClientRect();
    const abajo = limiteInferior(ref.current) - caja.bottom;
    setHaciaArriba(abajo < ALTO_LISTA && caja.top > abajo);
  }, [abierto, ref]);
  return abierto && haciaArriba;
}
