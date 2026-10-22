import { http } from './http';
import { getPage, type PageQuery, type PageResult } from './pagination';
import type {
  LoginRequestDTO,
  RolUsuario,
  TokenResponseDTO,
  UsuarioCreateRequestDTO,
  UsuarioResponseDTO,
  UsuarioUpdateRequestDTO,
} from '../types/api';

/** Microservicio de seguridad (distrimarket-ms-auth), a través del gateway. */
export const authApi = {
  login: (body: LoginRequestDTO) => http.post<TokenResponseDTO>('/auth/login', body),
  /** Usuario dueño del token: nombre, documento y, si es empleado, su cargo. */
  me: () => http.get<UsuarioResponseDTO>('/auth/me'),
  roles: () => http.get<RolUsuario[]>('/auth/roles'),

  /** Solo ADMIN. */
  usuarios: {
    list: (query?: PageQuery): Promise<PageResult<UsuarioResponseDTO>> => getPage<UsuarioResponseDTO>('/auth/usuarios', query),
    get: (id: number) => http.get<UsuarioResponseDTO>(`/auth/usuarios/${id}`),
    create: (body: UsuarioCreateRequestDTO) => http.post<UsuarioResponseDTO>('/auth/usuarios', body),
    update: (id: number, body: UsuarioUpdateRequestDTO) => http.put<UsuarioResponseDTO>(`/auth/usuarios/${id}`, body),
    remove: (id: number) => http.delete(`/auth/usuarios/${id}`),
  },
};
