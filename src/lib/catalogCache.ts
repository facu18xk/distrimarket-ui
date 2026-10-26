/**
 * Caché de catálogos chicos en sessionStorage (medios de pago, timbrados, categorías,
 * marcas, depósitos; ver services/catalogos). Se cargan una vez y se reutilizan en todas
 * las filas y pantallas. Lo demás no se guarda aquí: se pide al backend, que lo sirve desde Redis.
 *
 * - Lo guardado vence a los pocos minutos y se borra al cerrar sesión (sessionStorage).
 * - Dos pantallas que piden el mismo catálogo a la vez comparten el mismo pedido en curso.
 * - Al modificar un catálogo (por ejemplo, alta de un medio de pago) se invalida con {@link invalidar}.
 */
const PREFIJO = 'distrimarket_cat_';
const VIGENCIA_MS = 10 * 60 * 1000;

interface Guardado<T> {
  guardadoEn: number;
  datos: T;
}

const enCurso = new Map<string, Promise<unknown>>();

function leer<T>(clave: string, vigenciaMs: number): T | undefined {
  try {
    const crudo = sessionStorage.getItem(PREFIJO + clave);
    if (!crudo) return undefined;
    const guardado = JSON.parse(crudo) as Guardado<T>;
    return Date.now() - guardado.guardadoEn < vigenciaMs ? guardado.datos : undefined;
  } catch {
    return undefined;
  }
}

function escribir<T>(clave: string, datos: T): void {
  try {
    sessionStorage.setItem(PREFIJO + clave, JSON.stringify({ guardadoEn: Date.now(), datos } satisfies Guardado<T>));
  } catch {
    // Sin sessionStorage (modo privado, cuota llena) la app sigue funcionando sin caché.
  }
}

/** Devuelve el catálogo guardado o lo pide una sola vez al backend. */
export function conCache<T>(clave: string, cargar: () => Promise<T>, vigenciaMs = VIGENCIA_MS): Promise<T> {
  const guardado = leer<T>(clave, vigenciaMs);
  if (guardado !== undefined) return Promise.resolve(guardado);

  const pendiente = enCurso.get(clave);
  if (pendiente) return pendiente as Promise<T>;

  const pedido = cargar()
    .then((datos) => {
      escribir(clave, datos);
      return datos;
    })
    .finally(() => enCurso.delete(clave));
  enCurso.set(clave, pedido);
  return pedido;
}

/** Olvida uno o más catálogos: el próximo uso los vuelve a pedir. */
export function invalidar(...claves: string[]): void {
  for (const clave of claves) {
    try {
      sessionStorage.removeItem(PREFIJO + clave);
    } catch {
      // Nada que borrar.
    }
  }
}

/** Borra todos los catálogos (al cerrar sesión o cambiar de usuario). */
export function limpiarCatalogos(): void {
  try {
    Object.keys(sessionStorage)
      .filter((clave) => clave.startsWith(PREFIJO))
      .forEach((clave) => sessionStorage.removeItem(clave));
  } catch {
    // Nada que borrar.
  }
}

/** Índice por id para buscar nombres en O(1) al dibujar una tabla. */
export function indexar<T>(items: T[] | null | undefined, id: (item: T) => number): Map<number, T> {
  return new Map((items ?? []).map((item) => [id(item), item]));
}
