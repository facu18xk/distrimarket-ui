import type { PageResult } from './pagination';

/**
 * Páginas de listados ya traídas, solo en memoria (no en sessionStorage): volver a una página
 * o a una pestaña dentro de un minuto la muestra sin pedirla otra vez. Dos pantallas que piden
 * la misma página a la vez comparten el mismo pedido.
 *
 * Cualquier alta, modificación o baja que el backend confirma la vacía entera (ver http.ts),
 * así ninguna pantalla muestra datos de antes de un cambio.
 */
const VIGENCIA_MS = 60 * 1000;

const paginas = new Map<string, { guardadaEn: number; pagina: PageResult<unknown> }>();
const enCurso = new Map<string, Promise<PageResult<unknown>>>();

/** La página guardada (si sigue vigente), el pedido igual que ya está en curso o uno nuevo. */
export function pedirPagina<T>(clave: string, cargar: () => Promise<PageResult<T>>): Promise<PageResult<T>> {
  const guardada = paginas.get(clave);
  if (guardada && Date.now() - guardada.guardadaEn < VIGENCIA_MS) return Promise.resolve(guardada.pagina as PageResult<T>);

  const pendiente = enCurso.get(clave);
  if (pendiente) return pendiente as Promise<PageResult<T>>;

  const pedido = cargar()
    .then((pagina) => {
      // Si mientras tanto hubo un cambio (olvidarPaginas), esta respuesta ya no se guarda.
      if (enCurso.get(clave) === pedido) paginas.set(clave, { guardadaEn: Date.now(), pagina });
      return pagina;
    })
    .finally(() => {
      if (enCurso.get(clave) === pedido) enCurso.delete(clave);
    });
  enCurso.set(clave, pedido as Promise<PageResult<unknown>>);
  return pedido;
}

export function olvidarPaginas(): void {
  paginas.clear();
  enCurso.clear();
}
