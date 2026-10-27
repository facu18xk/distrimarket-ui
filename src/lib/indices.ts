/** Índice por id para buscar nombres en O(1) al dibujar una tabla. */
export function indexar<T>(items: T[] | null | undefined, id: (item: T) => number): Map<number, T> {
  return new Map((items ?? []).map((item) => [id(item), item]));
}
