import type { ProveedorResponseDTO } from '../types/api';

/** Nombre a mostrar de un proveedor: el de fantasía o, si no tiene, la razón social. */
export const nombreProveedor = (p?: ProveedorResponseDTO | null) => p?.nombreFantasia || p?.persona.nombreCompleto || '—';
