import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS } from '../../data/openApiContent';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  Lock,
  Boxes,
  Copy,
  Check,
  Code
} from 'lucide-react';

export const ApiSimulator: React.FC = () => {
  // Query state
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(5);
  const [sort, setSort] = useState<string>('nombre,asc');
  const [filterNombre, setFilterNombre] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  // Status simulation: '200' | '400' | '401' | '403' | '404' | '409' | '500'
  const [simulatedStatus, setSimulatedStatus] = useState<string>('200');
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('json');
  const [copied, setCopied] = useState(false);

  // Filtered and paginated simulated data
  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

    if (filterNombre.trim()) {
      result = result.filter((p) =>
        p.nombre.toLowerCase().includes(filterNombre.toLowerCase()) ||
        p.codigoBarra.includes(filterNombre.trim())
      );
    }

    if (filterCategoria !== 'all') {
      result = result.filter((p) => p.categoria.idCategoria === Number(filterCategoria));
    }

    if (filterEstado !== 'all') {
      const isActivo = filterEstado === 'true';
      result = result.filter((p) => p.estado === isActivo);
    }

    // Sort
    if (sort === 'nombre,asc') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sort === 'nombre,desc') {
      result.sort((a, b) => b.nombre.localeCompare(a.nombre));
    } else if (sort === 'precioVenta,asc') {
      result.sort((a, b) => a.precioVenta - b.precioVenta);
    } else if (sort === 'precioVenta,desc') {
      result.sort((a, b) => b.precioVenta - a.precioVenta);
    } else if (sort === 'stockActual,asc') {
      result.sort((a, b) => a.stockActual - b.stockActual);
    }

    return result;
  }, [filterNombre, filterCategoria, filterEstado, sort]);

  // Pagination calculation
  const totalElements = filteredProducts.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const paginatedContent = useMemo(() => {
    const startIndex = page * size;
    return filteredProducts.slice(startIndex, startIndex + size);
  }, [filteredProducts, page, size]);

  // Built URL
  const queryParams: string[] = [];
  if (page > 0) queryParams.push(`page=${page}`);
  if (size !== 10) queryParams.push(`size=${size}`);
  if (sort) queryParams.push(`sort=${sort}`);
  if (filterNombre) queryParams.push(`nombre=${encodeURIComponent(filterNombre)}`);
  if (filterCategoria !== 'all') queryParams.push(`idCategoria=${filterCategoria}`);
  if (filterEstado !== 'all') queryParams.push(`estado=${filterEstado}`);
  const builtUrl = `/api/v1/productos${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

  // Generate payload based on simulatedStatus
  const responsePayload = useMemo(() => {
    switch (simulatedStatus) {
      case '200':
        return {
          pageNumber: page,
          pageSize: size,
          totalElements: totalElements,
          totalPages: totalPages,
          isFirst: page === 0,
          isLast: page >= totalPages - 1,
          content: paginatedContent.map((p) => ({
            idProducto: p.idProducto,
            codigoBarra: p.codigoBarra,
            nombre: p.nombre,
            precioVenta: p.precioVenta,
            stockMinimo: p.stockMinimo,
            stockActual: p.stockActual,
            nombreCategoria: p.categoria.nombre,
            nombreMarca: p.marca.nombre,
            estado: p.estado
          }))
        };

      case '400':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 400,
          error: 'Bad Request',
          message: 'Error en los parámetros de la solicitud',
          path: builtUrl,
          details: [
            { field: 'size', message: 'El tamaño de página no puede exceder 100 elementos' },
            { field: 'precioMin', message: 'El precio mínimo debe ser un número positivo' }
          ]
        };

      case '401':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 401,
          error: 'Unauthorized',
          message: 'Token de autorización JWT no proporcionado o expirado',
          path: builtUrl
        };

      case '403':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 403,
          error: 'Forbidden',
          message: 'Acceso denegado: Tu rol de usuario (CAJERO_BASICO) no tiene permiso para consultar costos o modificar inventario',
          path: builtUrl
        };

      case '404':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 404,
          error: 'Not Found',
          message: 'No se encontró ningún producto con los criterios especificados o la categoría no existe',
          path: builtUrl
        };

      case '409':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 409,
          error: 'Conflict',
          message: "Conflicto de unicidad: El código de barra '7840001234567' ya pertenece a 'Leche Entera 1L'",
          path: '/api/v1/productos'
        };

      case '500':
        return {
          timestamp: '2026-09-17T12:34:56Z',
          status: 500,
          error: 'Internal Server Error',
          message: 'Error no controlado de conexión con la base de datos de depósitos',
          path: builtUrl
        };

      default:
        return {};
    }
  }, [simulatedStatus, page, size, totalElements, totalPages, paginatedContent, builtUrl]);

  const jsonString = JSON.stringify(responsePayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Playground Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" />
              <span>Simulador Interactivo de OpenAPI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Prueba GET /productos y Respuestas Reutilizables
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Modifica los parámetros de paginación y filtros, o activa errores HTTP (400, 403, 404, 409)
              para ver exactamente cómo se estructuran los DTOs en el JSON real.
            </p>
          </div>

          {/* Quick status selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Probar Estado:</span>
            {[
              { code: '200', label: '200 OK', color: 'emerald' },
              { code: '400', label: '400 Bad Req', color: 'amber' },
              { code: '403', label: '403 Forbidden', color: 'rose' },
              { code: '404', label: '404 Not Found', color: 'rose' },
              { code: '409', label: '409 Conflict', color: 'orange' }
            ].map((st) => (
              <button
                key={st.code}
                id={`btn-simulate-${st.code}`}
                onClick={() => setSimulatedStatus(st.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  simulatedStatus === st.code
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live URL Request bar */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 overflow-x-auto min-w-0 pr-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">GET</span>
            <span className="text-slate-300 truncate">{builtUrl}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded font-bold text-xs ${
                simulatedStatus === '200'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              HTTP {simulatedStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Controls on Left, Response JSON / View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Parámetros de Query (Filters & Pagination)
              </h3>
              <button
                onClick={() => {
                  setPage(0);
                  setSize(5);
                  setSort('nombre,asc');
                  setFilterNombre('');
                  setFilterCategoria('all');
                  setFilterEstado('all');
                  setSimulatedStatus('200');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            </div>

            {/* Pagination Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  page (Base 0) <span className="text-slate-500">PageQuery</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, totalPages - 1)}
                  value={page}
                  onChange={(e) => setPage(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  size (Máx 100) <span className="text-slate-500">SizeQuery</span>
                </label>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>2 productos</option>
                  <option value={5}>5 productos</option>
                  <option value={10}>10 productos</option>
                  <option value={20}>20 productos</option>
                </select>
              </div>
            </div>

            {/* Sort Control */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                sort (Ordenamiento) <span className="text-slate-500">SortQuery</span>
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="nombre,asc">Nombre (A - Z)</option>
                <option value="nombre,desc">Nombre (Z - A)</option>
                <option value="precioVenta,asc">Precio (Menor a Mayor)</option>
                <option value="precioVenta,desc">Precio (Mayor a Menor)</option>
                <option value="stockActual,asc">Stock Crítico (Menor primero)</option>
              </select>
            </div>

            {/* Business Filter: Search */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Filtro por Nombre o Código <span className="text-slate-500">FilterNombreQuery</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Leche, Arroz, 7840..."
                value={filterNombre}
                onChange={(e) => {
                  setFilterNombre(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Business Filter: Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoría <span className="text-slate-500">FilterCategoriaQuery</span>
              </label>
              <select
                value={filterCategoria}
                onChange={(e) => {
                  setFilterCategoria(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas las categorías</option>
                <option value="1">1 - Lácteos</option>
                <option value="2">2 - Almacén</option>
              </select>
            </div>

            {/* Business Filter: Estado */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estado <span className="text-slate-500">FilterEstadoQuery</span>
              </label>
              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos los estados</option>
                <option value="true">Activos (true)</option>
                <option value="false">Inactivos (false)</option>
              </select>
            </div>
          </div>

          {/* Explanation of current status */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm text-xs space-y-2">
            <h4 className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-indigo-400" />
              <span>¿Cómo se mapea este estado en OpenAPI?</span>
            </h4>
            {simulatedStatus === '200' ? (
              <p className="text-slate-400 leading-relaxed">
                Usa <code className="text-emerald-300">ProductoPageResponseDTO</code> que compone{' '}
                <code className="text-indigo-300">BasePageResponse</code> + arreglo de{' '}
                <code className="text-indigo-300">ProductoSummaryResponseDTO</code>.
              </p>
            ) : (
              <p className="text-slate-400 leading-relaxed">
                Usa la referencia reutilizable{' '}
                <code className="text-rose-300">
                  components/responses/
                  {simulatedStatus === '400'
                    ? 'BadRequestResponse'
                    : simulatedStatus === '403'
                    ? 'ForbiddenResponse'
                    : simulatedStatus === '404'
                    ? 'NotFoundResponse'
                    : simulatedStatus === '409'
                    ? 'ConflictResponse'
                    : 'UnauthorizedResponse'}
                </code>{' '}
                que encapsula <code className="text-indigo-300">ErrorResponseDTO</code>. ¡Así no tienes que
                repetir este schema en ninguna otra ruta!
              </p>
            )}
          </div>
        </div>

        {/* Response Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full">
            {/* View Mode & Copy Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cuerpo de Respuesta (JSON)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {simulatedStatus === '200' ? 'ProductoPageResponseDTO' : 'ErrorResponseDTO'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {simulatedStatus === '200' && (
                  <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg text-xs">
                    <button
                      onClick={() => setViewMode('json')}
                      className={`px-2 py-0.5 rounded ${
                        viewMode === 'json' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setViewMode('visual')}
                      className={`px-2 py-0.5 rounded ${
                        viewMode === 'visual' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                      }`}
                    >
                      Tabla Visual
                    </button>
                  </div>
                )}

                <button
                  onClick={handleCopyJson}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-all"
                  title="Copiar JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Body */}
            {viewMode === 'visual' && simulatedStatus === '200' ? (
              <div className="space-y-3 flex-1">
                {/* Pagination Stats Banner */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Página</span>
                    <span className="font-bold text-white text-sm">{page + 1} / {totalPages}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Elementos</span>
                    <span className="font-bold text-white text-sm">{totalElements}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">¿Es Primera?</span>
                    <span className="font-bold text-emerald-400 text-sm">{page === 0 ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">¿Es Última?</span>
                    <span className="font-bold text-indigo-400 text-sm">{page >= totalPages - 1 ? 'Sí' : 'No'}</span>
                  </div>
                </div>

                {/* Table of items */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Producto</th>
                        <th className="p-2.5">Categoría</th>
                        <th className="p-2.5">Precio</th>
                        <th className="p-2.5">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {paginatedContent.map((item) => (
                        <tr key={item.idProducto} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-slate-400">{item.idProducto}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-white">{item.nombre}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.codigoBarra}</div>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                              {item.categoria.nombre}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-emerald-400">
                            Gs. {item.precioVenta.toLocaleString()}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.stockActual <= item.stockMinimo
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {item.stockActual} un.
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono overflow-auto max-h-[500px] leading-relaxed text-slate-200">
                {jsonString}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
