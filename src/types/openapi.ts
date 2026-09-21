export interface StepData {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  badge: string;
  summary: string;
  why: string[];
  how: string[];
  currentCodeSnippet?: string;
  improvedCodeSnippet: string;
  keyTakeaway: string;
}

export interface ProductItem {
  idProducto: number;
  codigoBarra: string;
  nombre: string;
  descripcion: string;
  precioCosto: number;
  precioVenta: number;
  porcentajeIva: number;
  stockMinimo: number;
  stockActual: number;
  estado: boolean;
  categoria: {
    idCategoria: number;
    nombre: string;
    descripcion?: string;
  };
  marca: {
    idMarca: number;
    nombre: string;
  };
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: Array<{ field: string; message: string }>;
}
