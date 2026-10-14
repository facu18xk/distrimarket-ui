const moneda = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Guaraníes, sin decimales: "Gs. 12.000". */
export function formatMoney(value: number | null | undefined): string {
  return `Gs. ${moneda.format(value ?? 0)}`;
}

/** Fecha del backend (yyyy-MM-dd) a dd/MM/yyyy, sin corrimiento por zona horaria. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return value;
  return fecha.format(new Date(year, month - 1, day));
}

/** yyyy-MM-dd de hoy, para valores iniciales de campos de fecha. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
