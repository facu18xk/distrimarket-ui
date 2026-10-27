/**
 * Cliente HTTP único de la aplicación. Todo pasa por el API Gateway, así que
 * la UI ve un solo sistema: /ventas, /inventario y /compras son rutas del
 * mismo origen y el gateway las reparte al microservicio que corresponda.
 *
 * VITE_API_GATEWAY_URL vacío = mismo origen (en desarrollo lo resuelve el proxy
 * de Vite; ver vite.config.ts). Así el navegador no necesita CORS.
 */
import { serverErrors, session } from '../auth/session';

const GATEWAY_URL: string = (import.meta.env.VITE_API_GATEWAY_URL ?? '').replace(/\/$/, '');

/** Cuerpo de error que devuelven los microservicios (manejador global). */
export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  /** Ventas: campo -> mensaje. */
  validationErrors?: Record<string, string>;
  /** Inventario y compras: lista de campo y mensaje. */
  details?: { field: string; message: string }[] | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** Errores por campo, sin importar qué microservicio respondió. */
  get fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = { ...(this.body?.validationErrors ?? {}) };
    for (const detail of this.body?.details ?? []) {
      errors[detail.field] = detail.message;
    }
    return errors;
  }
}

/** Mensaje listo para mostrar al usuario a partir de cualquier error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const campos = Object.entries(error.fieldErrors).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    return campos.length > 0 ? `${error.message} (${campos.join('; ')})` : error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

function buildUrl(path: string, query?: QueryParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return `${GATEWAY_URL}${path}${suffix ? `?${suffix}` : ''}`;
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  401: 'Su sesión expiró. Inicie sesión nuevamente.',
  403: 'No tiene permisos para realizar esta operación.',
  502: 'El servicio no respondió. Verifique que el microservicio esté levantado.',
  503: 'El servicio no está disponible en este momento. Intente más tarde.',
  504: 'El servicio tardó demasiado en responder.',
};

/** Rutas públicas: un 401 aquí es "credenciales incorrectas", no una sesión vencida. */
const RUTAS_SIN_SESION = ['/auth/login'];

interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  /**
   * Dato complementario (el nombre de un empleado en una tabla): si falla, la pantalla sigue
   * igual, sin cerrar la sesión por un 403 ni mostrar la página de error.
   */
  complementario?: boolean;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = session.token();
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        // Cada pedido lleva el token: el gateway y cada microservicio lo validan.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    const mensaje = 'No se pudo conectar con el API Gateway. Verifique que esté levantado.';
    if (method === 'GET' && !options.complementario) serverErrors.notify(mensaje);
    throw new ApiError(0, mensaje, null);
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // El gateway o el proxy no siempre responden JSON (502, 504).
    }
    const message = body?.message ?? MENSAJES_POR_ESTADO[response.status] ?? `Error ${response.status}`;
    if (token && !RUTAS_SIN_SESION.includes(path) && !options.complementario) {
      // Sin autenticación o sin autorización: se cierra la sesión y se vuelve al login.
      if (response.status === 401) session.expired('Su sesión expiró o ya no es válida. Inicie sesión nuevamente.');
      if (response.status === 403) session.expired('Su usuario no tiene permisos para esa operación. Inicie sesión nuevamente.');
    }
    // Una carga que falla en el servidor muestra la página de error 500; un guardado muestra el mensaje en su formulario.
    if (method === 'GET' && response.status >= 500 && !options.complementario) serverErrors.notify(message);
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string, query?: QueryParams) => request<T>('GET', path, { query }),
  /** GET de un dato complementario: ver {@link RequestOptions.complementario}. */
  getComplementario: <T>(path: string) => request<T>('GET', path, { complementario: true }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: (path: string) => request<void>('DELETE', path),
};
