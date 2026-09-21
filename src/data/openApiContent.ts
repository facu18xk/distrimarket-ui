import { StepData, ProductItem } from '../types/openapi';

export const ORIGINAL_OPENAPI_YAML = `openapi: 3.0.3
info:
  title: DistriMarket API - Módulo Inventarios
  description: Contrato API inicial sin módulos de Compras ni Ventas y sin reutilización de Personas.
  version: 1.0.0
servers:
  - url: http://localhost:8080/api/v1
    description: Servidor Local de Desarrollo

paths:
  /productos:
    get:
      summary: Listar productos con paginación y filtros
      tags: [Productos]
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
      responses:
        '200':
          description: Lista paginada de productos

components:
  parameters:
    PageQuery:
      name: page
      in: query
      schema: { type: integer, default: 0 }
    SizeQuery:
      name: size
      in: query
      schema: { type: integer, default: 10 }`;

export const IMPROVED_OPENAPI_YAML = `openapi: 3.0.3
info:
  title: DistriMarket API - Sistema Integral de Gestión
  description: |
    Contrato API Enterprise unificado para DistriMarket:
    - **Inventarios:** Catálogo, saldos por depósito, ajustes y transferencias.
    - **Compras:** Facturas de compras (cabecera-detalle) y gestión de Proveedores.
    - **Ventas:** Facturación fiscal con Timbrados, Clientes y anulación de comprobantes.
    - **Personas & Administración:** Reutilización transversal de PersonaDTO (Física/Jurídica), Empleados y Medios de Pago.
    - **Estándar HTTP:** Manejo unificado de errores (400, 401, 403, 404, 409, 422, 500) según RFC 7807.
  version: 2.0.0
  contact:
    name: Equipo de Arquitectura DistriMarket
    email: api@distrimarket.com

servers:
  - url: http://localhost:8080/api/v1
    description: Servidor Local de Desarrollo (Spring Boot)
  - url: https://api.distrimarket.com/v1
    description: Servidor de Staging / Pruebas

# =============================================================
# 1. TAGS GLOBALES (Agrupación formal sin espacios en nombres)
# =============================================================
tags:
  - name: Productos
    description: Catálogo maestro de productos, precios y márgenes de ganancia.
  - name: Inventario-Stock
    description: Consulta de existencias físicas consolidadas por depósito.
  - name: Ajustes-Stock
    description: Correcciones de stock por mermas, vencimientos o sobrantes físicos.
  - name: Transferencias-Stock
    description: Movimientos de mercadería entre depósitos centrales y sucursales.
  - name: Compras-Facturas
    description: Registro de facturas de compra a proveedores con incremento automático de existencias.
  - name: Compras-Proveedores
    description: Padrón de proveedores comerciales (con Persona Jurídica o Física asociada).
  - name: Ventas-Facturas
    description: Emisión y anulación de comprobantes de venta con timbrado fiscal y descuento de stock.
  - name: Ventas-Clientes
    description: Registro y consulta de clientes corporativos y consumidores finales.
  - name: Ventas-Timbrados
    description: Administración de timbrados legales de la empresa, sucursales y puntos de expedición.
  - name: Personal-Empleados
    description: Gestión de empleados, roles de sistema y cargos en sucursales.
  - name: Administracion-General
    description: Catálogo de medios de pago, depósitos y parámetros del sistema.

# =============================================================
# 2. PATHS (RUTAS RESTful)
# =============================================================
paths:
  # -----------------------------------------------------------
  # INVENTARIOS: PRODUCTOS Y STOCK
  # -----------------------------------------------------------
  /productos:
    get:
      summary: Listar productos con paginación y filtros
      tags: [Productos]
      operationId: listarProductos
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/SortQuery'
        - $ref: '#/components/parameters/FilterNombreQuery'
        - $ref: '#/components/parameters/FilterCategoriaQuery'
        - $ref: '#/components/parameters/FilterMarcaQuery'
        - $ref: '#/components/parameters/FilterEstadoQuery'
      responses:
        '200':
          description: Catálogo paginado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductoPageResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedResponse'

    post:
      summary: Crear un nuevo producto
      tags: [Productos]
      operationId: crearProducto
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductoCreateDTO'
      responses:
        '201':
          description: Producto creado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductoDetailResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '409':
          $ref: '#/components/responses/ConflictResponse'

  /productos/{idProducto}:
    get:
      summary: Detalle de producto por ID
      tags: [Productos]
      operationId: obtenerProductoPorId
      parameters:
        - $ref: '#/components/parameters/ProductoIdPath'
      responses:
        '200':
          description: Ficha del producto
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductoDetailResponseDTO'
        '404':
          $ref: '#/components/responses/NotFoundResponse'

  /inventario/stock:
    get:
      summary: Consulta de existencias consolidadas por depósito
      tags: [Inventario-Stock]
      operationId: consultarStock
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/FilterDepositoQuery'
        - $ref: '#/components/parameters/FilterNombreQuery'
      responses:
        '200':
          description: Lista de stock por producto y depósito
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockDepositoPageResponseDTO'

  # -----------------------------------------------------------
  # COMPRAS: FACTURAS Y PROVEEDORES
  # -----------------------------------------------------------
  /compras/facturas:
    get:
      summary: Listar facturas de compra con paginación y filtros
      tags: [Compras-Facturas]
      operationId: listarFacturasCompra
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/SortQuery'
        - $ref: '#/components/parameters/FilterProveedorQuery'
        - $ref: '#/components/parameters/FilterDepositoQuery'
        - $ref: '#/components/parameters/FilterFechaDesdeQuery'
        - $ref: '#/components/parameters/FilterFechaHastaQuery'
        - $ref: '#/components/parameters/FilterNumeroFacturaQuery'
      responses:
        '200':
          description: Listado paginado de facturas de compra
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaCompraPageResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedResponse'
        '403':
          $ref: '#/components/responses/ForbiddenResponse'

    post:
      summary: Registrar factura de compra (Cabecera y Detalle)
      description: |
        Registra una compra a proveedor.
        - Valida restricción única: (idProveedor + numeroFactura + timbrado).
        - Incrementa automáticamente el stock en el depósito receptor.
        - Calcula subtotales, total IVA y total general.
      tags: [Compras-Facturas]
      operationId: registrarFacturaCompra
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FacturaCompraRequestDTO'
      responses:
        '201':
          description: Factura de compra registrada e inventario actualizado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaCompraResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '404':
          $ref: '#/components/responses/NotFoundResponse'
        '409':
          description: Factura ya registrada para este proveedor y timbrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDTO'
              example:
                timestamp: "2026-09-17T12:00:00Z"
                status: 409
                error: "Conflict"
                message: "Ya existe una factura registrada con ese número y timbrado para el proveedor indicado"
                path: "/api/v1/compras/facturas"

  /compras/facturas/{idFacturaCompra}:
    get:
      summary: Obtener el detalle completo de una factura de compra
      tags: [Compras-Facturas]
      operationId: obtenerFacturaCompraPorId
      parameters:
        - $ref: '#/components/parameters/FacturaCompraIdPath'
      responses:
        '200':
          description: Comprobante de compra con todos sus renglones
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaCompraResponseDTO'
        '404':
          $ref: '#/components/responses/NotFoundResponse'

  /compras/proveedores:
    get:
      summary: Listar proveedores comerciales
      tags: [Compras-Proveedores]
      operationId: listarProveedores
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/FilterNombreQuery'
        - $ref: '#/components/parameters/FilterEstadoQuery'
      responses:
        '200':
          description: Padrón de proveedores paginado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProveedorPageResponseDTO'

    post:
      summary: Registrar nuevo proveedor (Reutiliza PersonaCreateDTO)
      tags: [Compras-Proveedores]
      operationId: crearProveedor
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProveedorRequestDTO'
      responses:
        '201':
          description: Proveedor registrado exitosamente
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProveedorResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '409':
          $ref: '#/components/responses/ConflictResponse'

  /compras/proveedores/{idProveedor}:
    get:
      summary: Consultar proveedor por ID
      tags: [Compras-Proveedores]
      operationId: obtenerProveedorPorId
      parameters:
        - $ref: '#/components/parameters/ProveedorIdPath'
      responses:
        '200':
          description: Datos del proveedor
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProveedorResponseDTO'
        '404':
          $ref: '#/components/responses/NotFoundResponse'

  # -----------------------------------------------------------
  # VENTAS: FACTURAS, CLIENTES Y TIMBRADOS
  # -----------------------------------------------------------
  /ventas/facturas:
    get:
      summary: Listar facturas de venta emitidas
      tags: [Ventas-Facturas]
      operationId: listarFacturasVenta
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/SortQuery'
        - $ref: '#/components/parameters/FilterClienteQuery'
        - $ref: '#/components/parameters/FilterEmpleadoQuery'
        - $ref: '#/components/parameters/FilterDepositoQuery'
        - $ref: '#/components/parameters/FilterEstadoVentaQuery'
        - $ref: '#/components/parameters/FilterFechaDesdeQuery'
        - $ref: '#/components/parameters/FilterFechaHastaQuery'
      responses:
        '200':
          description: Listado paginado de facturas de venta
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaVentaPageResponseDTO'

    post:
      summary: Emitir una nueva factura de venta fiscal
      description: |
        Emite una venta formal en mostrador o distribución:
        - Valida que el timbrado esté vigente.
        - Verifica y descuenta stock disponible en el depósito de expedición.
        - Calcula subtotales, IVA según tasa de cada producto y total general.
      tags: [Ventas-Facturas]
      operationId: emitirFacturaVenta
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FacturaVentaRequestDTO'
      responses:
        '201':
          description: Factura emitida exitosamente y stock descontado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaVentaResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '404':
          $ref: '#/components/responses/NotFoundResponse'
        '422':
          description: Regla de negocio rota (Stock insuficiente o timbrado vencido)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDTO'
              example:
                timestamp: "2026-09-17T12:00:00Z"
                status: 422
                error: "Unprocessable Entity"
                message: "Stock insuficiente para 'Leche Entera 1L' en el depósito seleccionado (Disponible: 4, Solicitado: 10)"
                path: "/api/v1/ventas/facturas"

  /ventas/facturas/{idFacturaVenta}:
    get:
      summary: Obtener detalle y renglones de una factura de venta
      tags: [Ventas-Facturas]
      operationId: obtenerFacturaVentaPorId
      parameters:
        - $ref: '#/components/parameters/FacturaVentaIdPath'
      responses:
        '200':
          description: Factura de venta con sus detalles
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaVentaResponseDTO'
        '404':
          $ref: '#/components/responses/NotFoundResponse'

  /ventas/facturas/{idFacturaVenta}/anular:
    post:
      summary: Anular factura de venta
      description: Cambia el estado a ANULADA y reincorpora el stock al depósito original.
      tags: [Ventas-Facturas]
      operationId: anularFacturaVenta
      parameters:
        - $ref: '#/components/parameters/FacturaVentaIdPath'
      responses:
        '200':
          description: Factura anulada y stock devuelto al depósito
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacturaVentaResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '404':
          $ref: '#/components/responses/NotFoundResponse'
        '409':
          $ref: '#/components/responses/ConflictResponse'

  /ventas/clientes:
    get:
      summary: Listar clientes registrados
      tags: [Ventas-Clientes]
      operationId: listarClientes
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
        - $ref: '#/components/parameters/FilterNombreQuery'
        - $ref: '#/components/parameters/FilterEstadoQuery'
      responses:
        '200':
          description: Padrón de clientes paginado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ClientePageResponseDTO'

    post:
      summary: Registrar un nuevo cliente (Reutiliza PersonaCreateDTO)
      tags: [Ventas-Clientes]
      operationId: crearCliente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ClienteRequestDTO'
      responses:
        '201':
          description: Cliente dado de alta
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ClienteResponseDTO'
        '400':
          $ref: '#/components/responses/BadRequestResponse'
        '409':
          $ref: '#/components/responses/ConflictResponse'

  /ventas/timbrados:
    get:
      summary: Listar timbrados fiscales de la empresa
      tags: [Ventas-Timbrados]
      operationId: listarTimbrados
      responses:
        '200':
          description: Lista de timbrados autorizados
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TimbradoDTO'

    post:
      summary: Registrar nuevo timbrado fiscal
      tags: [Ventas-Timbrados]
      operationId: crearTimbrado
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TimbradoCreateDTO'
      responses:
        '201':
          description: Timbrado dado de alta
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TimbradoDTO'

  # -----------------------------------------------------------
  # PERSONAL: EMPLEADOS (Reutilización de PersonaDTO)
  # -----------------------------------------------------------
  /empleados:
    get:
      summary: Listar empleados de la empresa
      tags: [Personal-Empleados]
      operationId: listarEmpleados
      parameters:
        - $ref: '#/components/parameters/PageQuery'
        - $ref: '#/components/parameters/SizeQuery'
      responses:
        '200':
          description: Nómina de empleados paginada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmpleadoPageResponseDTO'

    post:
      summary: Registrar un nuevo empleado
      tags: [Personal-Empleados]
      operationId: crearEmpleado
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EmpleadoRequestDTO'
      responses:
        '201':
          description: Empleado registrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmpleadoResponseDTO'

  # -----------------------------------------------------------
  # ADMINISTRACIÓN: MEDIOS DE PAGO Y CONFIGURACIONES
  # -----------------------------------------------------------
  /medios-pago:
    get:
      summary: Listar medios de pago habilitados (Efectivo, Tarjeta, Transferencia, Cheque)
      tags: [Administracion-General]
      operationId: listarMediosPago
      responses:
        '200':
          description: Lista de medios de pago
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MedioPagoDTO'

  /configuraciones:
    get:
      summary: Obtener parámetros globales de configuración
      tags: [Administracion-General]
      operationId: listarConfiguraciones
      responses:
        '200':
          description: Lista clave-valor del sistema
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ConfiguracionDTO'

# =============================================================
# 3. COMPONENTS (REUTILIZACIÓN CENTRALIZADA)
# =============================================================
components:
  # -----------------------------------------------------------
  # PARÁMETROS REUTILIZABLES (Query & Path)
  # -----------------------------------------------------------
  parameters:
    PageQuery:
      name: page
      in: query
      description: Número de página (base 0)
      required: false
      schema:
        type: integer
        minimum: 0
        default: 0

    SizeQuery:
      name: size
      in: query
      description: Tamaño de página (máximo 100)
      required: false
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 10

    SortQuery:
      name: sort
      in: query
      description: Campo y dirección de ordenamiento (ej. fechaEmision,desc)
      required: false
      schema:
        type: string
        example: "fechaEmision,desc"

    FilterNombreQuery:
      name: nombre
      in: query
      description: Búsqueda textual parcial
      required: false
      schema:
        type: string

    FilterCategoriaQuery:
      name: idCategoria
      in: query
      schema:
        type: integer
        format: int64

    FilterMarcaQuery:
      name: idMarca
      in: query
      schema:
        type: integer
        format: int64

    FilterEstadoQuery:
      name: estado
      in: query
      schema:
        type: boolean
        default: true

    FilterProveedorQuery:
      name: idProveedor
      in: query
      description: Filtrar compras por ID de proveedor
      schema:
        type: integer
        format: int64

    FilterClienteQuery:
      name: idCliente
      in: query
      description: Filtrar ventas por ID de cliente
      schema:
        type: integer
        format: int64

    FilterEmpleadoQuery:
      name: idEmpleado
      in: query
      description: Filtrar ventas por empleado vendedor
      schema:
        type: integer
        format: int64

    FilterDepositoQuery:
      name: idDeposito
      in: query
      description: Filtrar por depósito
      schema:
        type: integer
        format: int64

    FilterNumeroFacturaQuery:
      name: numeroFactura
      in: query
      description: Búsqueda exacta o parcial de número de factura
      schema:
        type: string

    FilterEstadoVentaQuery:
      name: estado
      in: query
      description: Estado de la factura de venta (EMITIDA, ANULADA)
      schema:
        $ref: '#/components/schemas/EstadoFacturaVenta'

    FilterFechaDesdeQuery:
      name: fechaDesde
      in: query
      description: Fecha mínima (formato YYYY-MM-DD)
      schema:
        type: string
        format: date

    FilterFechaHastaQuery:
      name: fechaHasta
      in: query
      description: Fecha máxima (formato YYYY-MM-DD)
      schema:
        type: string
        format: date

    ProductoIdPath:
      name: idProducto
      in: path
      required: true
      schema:
        type: integer
        format: int64

    FacturaCompraIdPath:
      name: idFacturaCompra
      in: path
      required: true
      schema:
        type: integer
        format: int64

    FacturaVentaIdPath:
      name: idFacturaVenta
      in: path
      required: true
      schema:
        type: integer
        format: int64

    ProveedorIdPath:
      name: idProveedor
      in: path
      required: true
      schema:
        type: integer
        format: int64

    ClienteIdPath:
      name: idCliente
      in: path
      required: true
      schema:
        type: integer
        format: int64

  # -----------------------------------------------------------
  # RESPUESTAS DE ERROR REUTILIZABLES (RFC 7807)
  # -----------------------------------------------------------
  responses:
    BadRequestResponse:
      description: 400 Bad Request - Formato o validaciones de campo incorrectos
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

    UnauthorizedResponse:
      description: 401 Unauthorized - Token no proporcionado o expirado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

    ForbiddenResponse:
      description: 403 Forbidden - No cuenta con roles ni permisos suficientes
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

    NotFoundResponse:
      description: 404 Not Found - El recurso solicitado no existe
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

    ConflictResponse:
      description: 409 Conflict - Clave duplicada o estado contradictorio
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

    InternalServerErrorResponse:
      description: 500 Internal Server Error - Error inesperado del servidor
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseDTO'

  # -----------------------------------------------------------
  # SCHEMAS (DTOs)
  # -----------------------------------------------------------
  schemas:
    # ---------------------------------------------------------
    # ESQUEMA DE ERROR ESTÁNDAR
    # ---------------------------------------------------------
    ErrorResponseDTO:
      type: object
      required: [timestamp, status, error, message, path]
      properties:
        timestamp:
          type: string
          format: date-time
        status:
          type: integer
          example: 400
        error:
          type: string
          example: "Bad Request"
        message:
          type: string
          example: "Validación de formulario fallida"
        path:
          type: string
          example: "/api/v1/compras/facturas"
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
                example: "detalles"
              message:
                type: string
                example: "La factura debe tener al menos un producto"

    # ---------------------------------------------------------
    # PAGINACIÓN BASE
    # ---------------------------------------------------------
    BasePageResponse:
      type: object
      required: [pageNumber, pageSize, totalElements, totalPages, isFirst, isLast]
      properties:
        pageNumber:
          type: integer
          example: 0
        pageSize:
          type: integer
          example: 10
        totalElements:
          type: integer
          format: int64
          example: 85
        totalPages:
          type: integer
          example: 9
        isFirst:
          type: boolean
          example: true
        isLast:
          type: boolean
          example: false

    # ---------------------------------------------------------
    # ENUMS
    # ---------------------------------------------------------
    TipoPersona:
      type: string
      enum:
        - FISICA
        - JURIDICA
      example: JURIDICA

    EstadoFacturaVenta:
      type: string
      enum:
        - EMITIDA
        - ANULADA
      example: EMITIDA

    # ---------------------------------------------------------
    # 🌟 REUTILIZACIÓN NÚCLEO: PERSONA DTO
    # (Reutilizado por Cliente, Proveedor, Empleado y Usuario)
    # ---------------------------------------------------------
    PersonaBaseDTO:
      type: object
      required: [tipoPersona, nombreCompleto]
      properties:
        tipoPersona:
          $ref: '#/components/schemas/TipoPersona'
        nombreCompleto:
          type: string
          maxLength: 150
          description: Razón Social o Nombres y Apellidos
          example: "Distribuidora del Este S.A."
        ci:
          type: string
          maxLength: 20
          description: Cédula de Identidad (Obligatoria si tipoPersona es FISICA)
          example: "4123456"
        ruc:
          type: string
          maxLength: 20
          description: Registro Único de Contribuyente (Obligatorio si es JURIDICA)
          example: "80012345-6"
        telefono:
          type: string
          maxLength: 30
          example: "+595 21 555 123"
        correo:
          type: string
          format: email
          maxLength: 100
          example: "contacto@distrideleste.com"
        direccion:
          type: string
          maxLength: 200
          example: "Avda. Eusebio Ayala 2450"

    PersonaCreateDTO:
      allOf:
        - $ref: '#/components/schemas/PersonaBaseDTO'

    PersonaDTO:
      allOf:
        - $ref: '#/components/schemas/PersonaBaseDTO'
        - type: object
          required: [idPersona]
          properties:
            idPersona:
              type: integer
              format: int64
              example: 10

    # ---------------------------------------------------------
    # PROVEEDOR (Composición limpia: Proveedor + Persona)
    # ---------------------------------------------------------
    ProveedorRequestDTO:
      type: object
      required: [persona]
      properties:
        nombreFantasia:
          type: string
          maxLength: 150
          example: "Lácteos del Este"
        estado:
          type: boolean
          default: true
        persona:
          description: Datos de la persona física o jurídica asociada
          $ref: '#/components/schemas/PersonaCreateDTO'

    ProveedorResponseDTO:
      type: object
      required: [idProveedor, estado, persona]
      properties:
        idProveedor:
          type: integer
          format: int64
          example: 5
        nombreFantasia:
          type: string
          example: "Lácteos del Este"
        estado:
          type: boolean
          example: true
        persona:
          $ref: '#/components/schemas/PersonaDTO'

    # ---------------------------------------------------------
    # CLIENTE (Reutiliza PersonaDTO)
    # ---------------------------------------------------------
    ClienteRequestDTO:
      type: object
      required: [persona]
      properties:
        estado:
          type: boolean
          default: true
        persona:
          $ref: '#/components/schemas/PersonaCreateDTO'

    ClienteResponseDTO:
      type: object
      required: [idCliente, estado, persona]
      properties:
        idCliente:
          type: integer
          format: int64
          example: 12
        estado:
          type: boolean
          example: true
        persona:
          $ref: '#/components/schemas/PersonaDTO'

    # ---------------------------------------------------------
    # EMPLEADO (Reutiliza PersonaDTO)
    # ---------------------------------------------------------
    EmpleadoRequestDTO:
      type: object
      required: [cargo, fechaIngreso, persona]
      properties:
        cargo:
          type: string
          maxLength: 60
          example: "Cajero Principal"
        fechaIngreso:
          type: string
          format: date
          example: "2024-02-01"
        estado:
          type: boolean
          default: true
        persona:
          $ref: '#/components/schemas/PersonaCreateDTO'

    EmpleadoResponseDTO:
      type: object
      required: [idEmpleado, cargo, fechaIngreso, estado, persona]
      properties:
        idEmpleado:
          type: integer
          format: int64
          example: 3
        cargo:
          type: string
          example: "Cajero Principal"
        fechaIngreso:
          type: string
          format: date
          example: "2024-02-01"
        estado:
          type: boolean
          example: true
        persona:
          $ref: '#/components/schemas/PersonaDTO'

    # ---------------------------------------------------------
    # 🌟 REUTILIZACIÓN: COMPROBANTE Y COMPROBANTE DETALLE
    # (Refleja @MappedSuperclass Comprobante y ComprobanteDetalle)
    # ---------------------------------------------------------
    BaseComprobante:
      type: object
      required: [numeroFactura, fechaEmision]
      properties:
        numeroFactura:
          type: string
          maxLength: 50
          description: Formato fiscal (ej. 001-001-0001234)
          example: "001-001-0001234"
        fechaEmision:
          type: string
          format: date
          description: Fecha de emisión del comprobante
          example: "2026-09-15"

    BaseComprobanteDetalle:
      type: object
      required: [idProducto, cantidad, precioUnitario]
      properties:
        idProducto:
          type: integer
          format: int64
          example: 101
        cantidad:
          type: integer
          minimum: 1
          example: 10
        precioUnitario:
          type: number
          minimum: 0
          example: 5000.00
        porcentajeIva:
          type: number
          enum: [0, 5, 10]
          default: 10
          example: 10

    # ---------------------------------------------------------
    # COMPRAS: FACTURAS (Cabecera y Detalle)
    # ---------------------------------------------------------
    FacturaCompraDetalleRequestDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobanteDetalle'

    FacturaCompraRequestDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobante'
        - type: object
          required: [idProveedor, idDeposito, idMedioPago, timbrado, detalles]
          properties:
            idProveedor:
              type: integer
              format: int64
              example: 5
            idDeposito:
              type: integer
              format: int64
              description: Depósito receptor del stock
              example: 1
            idMedioPago:
              type: integer
              format: int64
              example: 1
            timbrado:
              type: string
              maxLength: 20
              description: Timbrado impreso de la factura del proveedor
              example: "15894231"
            detalles:
              type: array
              minItems: 1
              items:
                $ref: '#/components/schemas/FacturaCompraDetalleRequestDTO'

    FacturaCompraDetalleResponseDTO:
      type: object
      required: [idDetalle, idProducto, nombreProducto, cantidad, precioUnitario, subtotal, montoIva]
      properties:
        idDetalle:
          type: integer
          format: int64
          example: 301
        idProducto:
          type: integer
          format: int64
          example: 101
        nombreProducto:
          type: string
          example: "Leche Entera 1L"
        codigoBarra:
          type: string
          example: "7840001234567"
        cantidad:
          type: integer
          example: 10
        precioUnitario:
          type: number
          example: 5000.00
        subtotal:
          type: number
          example: 50000.00
        porcentajeIva:
          type: number
          example: 10
        montoIva:
          type: number
          description: Monto de IVA liquidado incluido en el subtotal
          example: 4545.45

    FacturaCompraResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobante'
        - type: object
          required: [idFacturaCompra, timbrado, totalIva, totalGeneral, proveedor, deposito, medioPago, detalles]
          properties:
            idFacturaCompra:
              type: integer
              format: int64
              example: 45
            timbrado:
              type: string
              example: "15894231"
            totalIva:
              type: number
              example: 9090.91
            totalGeneral:
              type: number
              example: 100000.00
            proveedor:
              $ref: '#/components/schemas/ProveedorResponseDTO'
            deposito:
              $ref: '#/components/schemas/DepositoDTO'
            medioPago:
              $ref: '#/components/schemas/MedioPagoDTO'
            detalles:
              type: array
              items:
                $ref: '#/components/schemas/FacturaCompraDetalleResponseDTO'

    # ---------------------------------------------------------
    # VENTAS: FACTURAS (Cabecera y Detalle)
    # ---------------------------------------------------------
    FacturaVentaDetalleRequestDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobanteDetalle'

    FacturaVentaRequestDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobante'
        - type: object
          required: [idCliente, idEmpleado, idDeposito, idMedioPago, idTimbrado, detalles]
          properties:
            idCliente:
              type: integer
              format: int64
              example: 12
            idEmpleado:
              type: integer
              format: int64
              example: 3
            idDeposito:
              type: integer
              format: int64
              description: Depósito desde el cual se descarga el stock vendido
              example: 1
            idMedioPago:
              type: integer
              format: int64
              example: 1
            idTimbrado:
              type: integer
              format: int64
              description: Timbrado fiscal propio de la empresa a utilizar
              example: 2
            detalles:
              type: array
              minItems: 1
              items:
                $ref: '#/components/schemas/FacturaVentaDetalleRequestDTO'

    FacturaVentaDetalleResponseDTO:
      type: object
      required: [idDetalle, idProducto, nombreProducto, cantidad, precioUnitario, subtotal, montoIva]
      properties:
        idDetalle:
          type: integer
          format: int64
          example: 801
        idProducto:
          type: integer
          format: int64
          example: 101
        nombreProducto:
          type: string
          example: "Leche Entera 1L"
        cantidad:
          type: integer
          example: 2
        precioUnitario:
          type: number
          example: 6000.00
        subtotal:
          type: number
          example: 12000.00
        porcentajeIva:
          type: number
          example: 10
        montoIva:
          type: number
          example: 1090.91

    FacturaVentaResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BaseComprobante'
        - type: object
          required: [idFacturaVenta, estado, totalIva, totalGeneral, cliente, empleado, timbrado, detalles]
          properties:
            idFacturaVenta:
              type: integer
              format: int64
              example: 98
            estado:
              $ref: '#/components/schemas/EstadoFacturaVenta'
            totalIva:
              type: number
              example: 5454.55
            totalGeneral:
              type: number
              example: 60000.00
            cliente:
              $ref: '#/components/schemas/ClienteResponseDTO'
            empleado:
              $ref: '#/components/schemas/EmpleadoResponseDTO'
            deposito:
              $ref: '#/components/schemas/DepositoDTO'
            medioPago:
              $ref: '#/components/schemas/MedioPagoDTO'
            timbrado:
              $ref: '#/components/schemas/TimbradoDTO'
            detalles:
              type: array
              items:
                $ref: '#/components/schemas/FacturaVentaDetalleResponseDTO'

    # ---------------------------------------------------------
    # TIMBRADOS FISCALES
    # ---------------------------------------------------------
    TimbradoCreateDTO:
      type: object
      required: [numeroTimbrado, fechaInicio, fechaVencimiento]
      properties:
        numeroTimbrado:
          type: string
          maxLength: 20
          example: "16543210"
        fechaInicio:
          type: string
          format: date
          example: "2026-01-01"
        fechaVencimiento:
          type: string
          format: date
          example: "2026-12-31"
        sucursal:
          type: string
          maxLength: 3
          default: "001"
          example: "001"
        puntoExpedicion:
          type: string
          maxLength: 3
          default: "001"
          example: "001"
        activo:
          type: boolean
          default: true

    TimbradoDTO:
      allOf:
        - $ref: '#/components/schemas/TimbradoCreateDTO'
        - type: object
          required: [idTimbrado]
          properties:
            idTimbrado:
              type: integer
              format: int64
              example: 2

    # ---------------------------------------------------------
    # ADMINISTRACIÓN Y AUXILIARES
    # ---------------------------------------------------------
    MedioPagoDTO:
      type: object
      required: [idMedioPago, nombre]
      properties:
        idMedioPago:
          type: integer
          format: int64
          example: 1
        nombre:
          type: string
          maxLength: 50
          example: "Efectivo"
        activo:
          type: boolean
          example: true

    DepositoDTO:
      type: object
      required: [idDeposito, nombre]
      properties:
        idDeposito:
          type: integer
          format: int64
          example: 1
        nombre:
          type: string
          example: "Depósito Central"
        ubicacion:
          type: string
          example: "Av. Mariscal López 1234"
        estado:
          type: boolean
          example: true

    ConfiguracionDTO:
      type: object
      required: [idConfiguracion, clave, valor]
      properties:
        idConfiguracion:
          type: integer
          format: int64
          example: 1
        clave:
          type: string
          example: "IVA_DEFECTO"
        valor:
          type: string
          example: "10"
        descripcion:
          type: string
          example: "Tasa general de IVA aplicada por omisión"

    StockDepositoResponseDTO:
      type: object
      required: [idStock, idDeposito, idProducto, cantidad]
      properties:
        idStock:
          type: integer
          format: int64
          example: 1
        idDeposito:
          type: integer
          format: int64
          example: 1
        nombreDeposito:
          type: string
          example: "Depósito Central"
        idProducto:
          type: integer
          format: int64
          example: 101
        nombreProducto:
          type: string
          example: "Leche Entera 1L"
        cantidad:
          type: integer
          example: 150

    # ---------------------------------------------------------
    # PRODUCTOS DTOs
    # ---------------------------------------------------------
    ProductoCreateDTO:
      type: object
      required: [nombre, precioCosto, precioVenta, porcentajeIva, stockMinimo, idCategoria, idMarca]
      properties:
        codigoBarra:
          type: string
          example: "7840001234567"
        nombre:
          type: string
          example: "Leche Entera 1L"
        descripcion:
          type: string
          example: "Leche ultra pasteurizada cartón 1 litro"
        precioCosto:
          type: number
          example: 4500.00
        precioVenta:
          type: number
          example: 6000.00
        porcentajeIva:
          type: number
          enum: [0, 5, 10]
          example: 10
        stockMinimo:
          type: integer
          example: 10
        idCategoria:
          type: integer
          format: int64
          example: 1
        idMarca:
          type: integer
          format: int64
          example: 1
        estado:
          type: boolean
          default: true

    ProductoDetailResponseDTO:
      type: object
      required: [idProducto, nombre, precioVenta, stockActual, estado]
      properties:
        idProducto:
          type: integer
          format: int64
          example: 101
        codigoBarra:
          type: string
          example: "7840001234567"
        nombre:
          type: string
          example: "Leche Entera 1L"
        precioVenta:
          type: number
          example: 6000.00
        stockActual:
          type: integer
          example: 42
        estado:
          type: boolean
          example: true

    # ---------------------------------------------------------
    # RESPUESTAS PAGINADAS (Heredan de BasePageResponse)
    # ---------------------------------------------------------
    ProductoPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/ProductoDetailResponseDTO'

    FacturaCompraPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/FacturaCompraResponseDTO'

    FacturaVentaPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/FacturaVentaResponseDTO'

    ProveedorPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/ProveedorResponseDTO'

    ClientePageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/ClienteResponseDTO'

    EmpleadoPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/EmpleadoResponseDTO'

    StockDepositoPageResponseDTO:
      allOf:
        - $ref: '#/components/schemas/BasePageResponse'
        - type: object
          required: [content]
          properties:
            content:
              type: array
              items:
                $ref: '#/components/schemas/StockDepositoResponseDTO'
`;

export const STEPS_DATA: StepData[] = [
  {
    id: 'step-1-persona-reuse',
    number: 1,
    title: 'Reutilización Maestra: El patrón PersonaDTO',
    subtitle: 'Cómo usar PersonaDTO para Proveedor, Cliente y Empleado',
    badge: 'Herencia y Composición',
    summary: 'En JPA tienes la entidad Persona con @OneToOne hacia Proveedor, Cliente y Empleado. En OpenAPI, podemos modelar esto mediante Composición limpia con $ref.',
    why: [
      'Tanto un Cliente, un Proveedor como un Empleado comparten los mismos atributos biográficos y tributarios: tipoPersona (FISICA/JURIDICA), ci, ruc, nombreCompleto, telefono, correo y direccion.',
      'Si duplicaras estos campos en ClienteDTO, ProveedorDTO y EmpleadoDTO, cada cambio fiscal (ej: añadir WhatsApp o digito verificador de RUC) te obligaría a modificar 3 archivos diferentes.',
      'Con la composición en OpenAPI ({ persona: { $ref: "#/components/schemas/PersonaCreateDTO" } }), centralizas la validación y desacoplas la identidad de la persona de su rol comercial.'
    ],
    how: [
      'Crear PersonaBaseDTO con las propiedades comunes (tipoPersona, ci, ruc, etc.).',
      'Crear PersonaCreateDTO para el alta y PersonaDTO con idPersona para respuestas.',
      'En ClienteRequestDTO, ProveedorRequestDTO y EmpleadoRequestDTO, incluir la propiedad "persona: { $ref: "#/components/schemas/PersonaCreateDTO" }".'
    ],
    currentCodeSnippet: `# Sin reutilización (campos duplicados en cada DTO):
ClienteRequestDTO:
  properties: { nombreCompleto, ci, ruc, telefono, ... }
ProveedorRequestDTO:
  properties: { nombreCompleto, ci, ruc, telefono, ... }`,
    improvedCodeSnippet: `# Con composición elegante de PersonaDTO:
PersonaBaseDTO:
  properties: { tipoPersona, nombreCompleto, ci, ruc, telefono, correo, direccion }

ClienteRequestDTO:
  type: object
  required: [persona]
  properties:
    estado: { type: boolean, default: true }
    persona: { $ref: '#/components/schemas/PersonaCreateDTO' }

ProveedorRequestDTO:
  type: object
  required: [persona]
  properties:
    nombreFantasia: { type: string }
    persona: { $ref: '#/components/schemas/PersonaCreateDTO' }`,
    keyTakeaway: 'Centralizar los datos en PersonaDTO evita redundancia y mapea 1 a 1 con la relación @OneToOne de JPA.'
  },
  {
    id: 'step-2-comprobante-inheritance',
    number: 2,
    title: 'Mapeo de @MappedSuperclass Comprobante a OpenAPI',
    subtitle: 'Herencia de cabecera y renglones de detalle con allOf',
    badge: 'Compras y Ventas',
    summary: 'En tus modelos de Spring Boot, Comprobante y ComprobanteDetalle son clases abstractas (@MappedSuperclass) que comparten numeroFactura, fechaEmision, totalIva, totalGeneral, precioUnitario y calculo de IVA.',
    why: [
      'Una Factura de Compra y una Factura de Venta tienen la misma estructura matemática: cabecera con totales fiscales y lista de productos con subtotales e IVA.',
      'OpenAPI 3.0 implementa herencia mediante el operador "allOf".',
      'Definir BaseComprobante y BaseComprobanteDetalle permite que Compras y Ventas compartan el contrato contable básico sin reinventar la rueda.'
    ],
    how: [
      'Definir BaseComprobante con numeroFactura y fechaEmision.',
      'Definir BaseComprobanteDetalle con idProducto, cantidad, precioUnitario y porcentajeIva.',
      'Usar allOf en FacturaCompraRequestDTO y FacturaVentaRequestDTO para heredar la cabecera y añadir sus llaves foráneas específicas.'
    ],
    currentCodeSnippet: `# Código duplicado en compras y ventas:
FacturaCompra: { numeroFactura, fechaEmision, ... }
FacturaVenta:  { numeroFactura, fechaEmision, ... }`,
    improvedCodeSnippet: `BaseComprobante:
  properties: { numeroFactura, fechaEmision }

FacturaCompraRequestDTO:
  allOf:
    - $ref: '#/components/schemas/BaseComprobante'
    - type: object
      required: [idProveedor, idDeposito, idMedioPago, timbrado, detalles]
      properties:
        idProveedor: { type: integer, format: int64 }
        timbrado: { type: string }
        detalles: { type: array, items: { $ref: '#/components/schemas/FacturaCompraDetalleRequestDTO' } }`,
    keyTakeaway: 'allOf en OpenAPI equivale al "extends" de Java para clases @MappedSuperclass.'
  },
  {
    id: 'step-3-compras-business',
    number: 3,
    title: 'Módulo de Compras: Control de Unicidad y Stock',
    subtitle: 'Manejo del error 409 Conflict y recepción de inventario',
    badge: 'Compras',
    summary: 'En FacturaCompra tienes la restricción de base de datos @UniqueConstraint uq_proveedor_factura (id_proveedor, numero_factura, timbrado).',
    why: [
      'Un proveedor no puede facturar dos veces el mismo número con el mismo timbrado.',
      'Si el usuario intenta registrarla de nuevo, el backend lanzará DataIntegrityViolationException. En la API REST esto debe comunicarse como 409 Conflict con mensaje claro.',
      'Al guardarse la compra, el stock físico del depósito elegido se incrementa automáticamente.'
    ],
    how: [
      'Definir POST /compras/facturas con respuesta 201 Created y 409 Conflict.',
      'Añadir filtro de búsqueda por proveedor, número de factura y rango de fechas.',
      'Devolver la cabecera enriquecida con los nombres de proveedor y depósito.'
    ],
    currentCodeSnippet: `# Sin control de conflicto documentado:
responses:
  '201': ...`,
    improvedCodeSnippet: `responses:
  '201': { description: 'Factura procesada y stock ingresado' }
  '409':
    description: Factura ya registrada para este proveedor y timbrado
    content:
      application/json:
        schema: { $ref: '#/components/schemas/ErrorResponseDTO' }`,
    keyTakeaway: 'Documentar el 409 previene que el frontend muestre un genérico "Error de servidor" al operador.'
  },
  {
    id: 'step-4-ventas-fiscal',
    number: 4,
    title: 'Módulo de Ventas: Timbrado Fiscal y Validación de Stock',
    subtitle: 'Descuento de existencias y anulación de comprobantes',
    badge: 'Ventas',
    summary: 'A diferencia de compras donde el timbrado es del proveedor, en Ventas la empresa utiliza su propio Timbrado registrado en la SET/Hacienda, y debe validar que haya stock en el depósito.',
    why: [
      'Si el timbrado está vencido o no hay stock suficiente, la regla de negocio falla. El código HTTP correcto es 422 Unprocessable Entity.',
      'La anulación de una venta (POST /ventas/facturas/{id}/anular) debe retornar el stock al depósito y marcar el estado como ANULADA.',
      'La separación de DTOs asegura que las tablas de ventas no tengan que descargar miles de renglones al cargar la pantalla principal.'
    ],
    how: [
      'Crear endpoints POST /ventas/facturas y POST /ventas/facturas/{idFacturaVenta}/anular.',
      'Enlazar con TimbradoDTO (fechaInicio, fechaVencimiento, puntoExpedicion, sucursal).',
      'Tipar el campo estado con el enum EstadoFacturaVenta (EMITIDA, ANULADA).'
    ],
    currentCodeSnippet: `# Sin endpoints de ventas ni timbrados`,
    improvedCodeSnippet: `/ventas/facturas:
  post:
    summary: Emitir una nueva factura de venta fiscal
    responses:
      '201': { description: 'Factura emitida y stock descontado' }
      '422':
        description: 'Stock insuficiente en depósito o timbrado vencido'
        content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponseDTO' } } }`,
    keyTakeaway: 'Usa 422 para reglas de negocio no satisfechas (stock insuficiente, timbrado vencido) en vez de 500.'
  },
  {
    id: 'step-5-full-enterprise',
    number: 5,
    title: 'Padrón de Clientes, Proveedores y Empleados',
    subtitle: 'Navegación fluida y endpoints de administración',
    badge: 'Administración',
    summary: 'Completamos el ecosistema con /ventas/clientes, /compras/proveedores, /empleados, /medios-pago y /configuraciones.',
    why: [
      'Permite que el sistema sea 100% autónomo: el frontend puede alimentar los desplegables de clientes, medios de pago y depósitos antes de emitir una factura.',
      'Todos los listados implementan la misma paginación BasePageResponse y los mismos códigos de error.'
    ],
    how: [
      'Exponer /medios-pago para alimentar los selectores de medio de pago.',
      'Exponer /ventas/timbrados para seleccionar el timbrado activo.',
      'Unificar los DTOs de salida para simplificar la renderización en tablas.'
    ],
    currentCodeSnippet: `# No existían las rutas de medios de pago ni timbrados.`,
    improvedCodeSnippet: `/medios-pago:
  get:
    summary: Listar medios de pago habilitados (Efectivo, Tarjeta, Cheque, Transferencia)
    responses:
      '200': { content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/MedioPagoDTO' } } } } }`,
    keyTakeaway: 'Una API empresarial proporciona catálogos maestros para que las vistas transaccionales nunca queden con datos incompletos.'
  }
];

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    idProducto: 101,
    codigoBarra: '7840001234567',
    nombre: 'Leche Entera 1L',
    descripcion: 'Leche ultra pasteurizada cartón 1 litro larga vida',
    precioCosto: 4500,
    precioVenta: 6000,
    porcentajeIva: 10,
    stockMinimo: 10,
    stockActual: 42,
    estado: true,
    categoria: { idCategoria: 1, nombre: 'Lácteos', descripcion: 'Lácteos y derivados refrigerados' },
    marca: { idMarca: 1, nombre: 'Trébol' }
  },
  {
    idProducto: 102,
    codigoBarra: '7840009876543',
    nombre: 'Yogur Frutilla 1L',
    descripcion: 'Yogur bebible sabor frutilla endulzado',
    precioCosto: 6200,
    precioVenta: 8500,
    porcentajeIva: 10,
    stockMinimo: 15,
    stockActual: 8,
    estado: true,
    categoria: { idCategoria: 1, nombre: 'Lácteos' },
    marca: { idMarca: 1, nombre: 'Trébol' }
  },
  {
    idProducto: 103,
    codigoBarra: '7840003322114',
    nombre: 'Queso Paraguay 1Kg',
    descripcion: 'Queso fresco tradicional artesanal',
    precioCosto: 28000,
    precioVenta: 36000,
    porcentajeIva: 5,
    stockMinimo: 5,
    stockActual: 14,
    estado: true,
    categoria: { idCategoria: 1, nombre: 'Lácteos' },
    marca: { idMarca: 2, nombre: 'La Holandesa' }
  }
];
