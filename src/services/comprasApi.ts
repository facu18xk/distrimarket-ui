import { http } from './http';
import { crudResource, readResource } from './resource';
import type {
  FacturaCompraRequestDTO,
  FacturaCompraResponseDTO,
  OrdenCompraDTO,
  ProveedorRequestDTO,
  ProveedorResponseDTO,
} from '../types/api';

/** Microservicio de compras (distrimarket-ms-featureA), a través del gateway. */
export const comprasApi = {
  proveedores: crudResource<ProveedorResponseDTO, ProveedorRequestDTO>('/compras/proveedores'),
  facturas: {
    ...crudResource<FacturaCompraResponseDTO, FacturaCompraRequestDTO>('/compras/facturas'),
    anular: (id: number) => http.patch<FacturaCompraResponseDTO>(`/compras/facturas/${id}/anular`),
  },
  ordenes: readResource<OrdenCompraDTO>('/compras/ordenes'),
};
