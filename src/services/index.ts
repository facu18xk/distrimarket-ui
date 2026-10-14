// Conexión con los microservicios (a través del API Gateway)
export * from './http';
export * from './pagination';
export * from './resource';
export * from './ventasApi';
export * from './inventarioApi';
export * from './comprasApi';

// Promociones todavía no tiene microservicio: sus datos viven en el navegador
export * from './apiClient';
export * from './promocionService';
