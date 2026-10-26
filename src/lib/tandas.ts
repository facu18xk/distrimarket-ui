/** Pedidos simultáneos como máximo al buscar varios ids, para no saturar a un microservicio. */
export const SIMULTANEOS = 3;

/** Busca cada id con a lo sumo SIMULTANEOS pedidos en curso; un id que falla queda en null. */
export async function enTandas<T>(ids: number[], buscar: (id: number) => Promise<T>): Promise<(readonly [number, T | null])[]> {
  const resultados: (readonly [number, T | null])[] = [];
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < ids.length) {
      const id = ids[siguiente++];
      resultados.push(await buscar(id).then((dato) => [id, dato] as const, () => [id, null] as const));
    }
  };
  await Promise.all(Array.from({ length: Math.min(SIMULTANEOS, ids.length) }, trabajador));
  return resultados;
}
