import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, Layers } from 'lucide-react';

export const BackendEquivalence: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<'spring' | 'nestjs' | 'dotnet'>('spring');
  const [copied, setCopied] = useState(false);

  const springBootCode = `// ============================================================================
// 1. REUTILIZACIÓN DE DTOs: PERSONA (Para Clientes, Proveedores y Empleados)
// ============================================================================
public record PersonaCreateDTO(
    @NotNull(message = "El tipo de persona es requerido (FISICA o JURIDICA)")
    TipoPersona tipoPersona,

    @NotBlank(message = "El nombre o razón social es obligatorio")
    @Size(max = 150)
    String nombreCompleto,

    @Size(max = 20)
    String ci,

    @Size(max = 20)
    String ruc,

    String telefono,
    @Email String correo,
    String direccion
) {}

// El DTO del Proveedor REUTILIZA PersonaCreateDTO sin duplicar campos:
public record ProveedorRequestDTO(
    String nombreFantasia,
    Boolean estado,
    @Valid @NotNull PersonaCreateDTO persona // <- ¡Composición limpia y validada!
) {}

// El DTO del Cliente REUTILIZA exactamente el mismo PersonaCreateDTO:
public record ClienteRequestDTO(
    Boolean estado,
    @Valid @NotNull PersonaCreateDTO persona // <- ¡Reutilización 100%!
) {}

// El DTO del Empleado añade cargo y fecha, pero REUTILIZA PersonaCreateDTO:
public record EmpleadoRequestDTO(
    @NotBlank String cargo,
    @NotNull LocalDate fechaIngreso,
    @Valid @NotNull PersonaCreateDTO persona
) {}

// ============================================================================
// 2. HERENCIA DE COMPROBANTES (@MappedSuperclass -> DTOs Base)
// ============================================================================
public record BaseComprobanteDetalleDTO(
    @NotNull Long idProducto,
    @NotNull @Min(1) Integer cantidad,
    @NotNull @PositiveOrZero BigDecimal precioUnitario,
    BigDecimal porcentajeIva
) {}

// Compra a Proveedor:
public record FacturaCompraRequestDTO(
    @NotBlank String numeroFactura,
    @NotNull LocalDate fechaEmision,
    @NotBlank String timbrado,
    @NotNull Long idProveedor,
    @NotNull Long idDeposito,
    @NotNull Long idMedioPago,
    @NotEmpty List<@Valid BaseComprobanteDetalleDTO> detalles
) {}

// Venta con Timbrado Fiscal Propio y Descuento de Stock:
public record FacturaVentaRequestDTO(
    @NotBlank String numeroFactura,
    @NotNull LocalDate fechaEmision,
    @NotNull Long idTimbrado,
    @NotNull Long idCliente,
    @NotNull Long idEmpleado,
    @NotNull Long idDeposito,
    @NotNull Long idMedioPago,
    @NotEmpty List<@Valid BaseComprobanteDetalleDTO> detalles
) {}

// ============================================================================
// 3. GLOBAL EXCEPTION HANDLER (Respuestas Reutilizables 400, 404, 409, 422)
// ============================================================================
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 Not Found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            new ErrorResponseDTO(Instant.now(), 404, "Not Found", ex.getMessage(), req.getRequestURI(), null)
        );
    }

    // 409 Conflict (ej: restricción uq_proveedor_factura en base de datos)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConflict(DataIntegrityViolationException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            new ErrorResponseDTO(Instant.now(), 409, "Conflict", 
                "Conflicto de integridad: ya existe un comprobante registrado con ese número y timbrado", 
                req.getRequestURI(), null)
        );
    }

    // 422 Unprocessable Entity (Stock insuficiente o timbrado vencido)
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponseDTO> handleBusinessRule(BusinessRuleException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
            new ErrorResponseDTO(Instant.now(), 422, "Unprocessable Entity", ex.getMessage(), req.getRequestURI(), null)
        );
    }

    // 400 Bad Request (Validación Bean Validation @Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        var details = ex.getBindingResult().getFieldErrors().stream()
            .map(err -> new FieldErrorDTO(err.getField(), err.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new ErrorResponseDTO(Instant.now(), 400, "Bad Request", "Validación fallida", req.getRequestURI(), details)
        );
    }
}`;

  const nestJsCode = `// ============================================================================
// 1. CONTROLADOR NESTJS (Decoradores @ApiTags, @Get, @Post)
// ============================================================================
@ApiTags('Productos')
@Controller('api/v1/productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con paginación y filtros' })
  @ApiResponse({ status: 200, type: ProductoPageResponseDTO })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listar(@Query() query: ProductoFilterAndPaginationDto): Promise<ProductoPageResponseDTO> {
    return this.productosService.findAll(query);
  }

  @Post()
  @ApiResponse({ status: 201, type: ProductoDetailResponseDTO })
  @ApiResponse({ status: 409, description: 'Conflicto de código de barras' })
  async crear(@Body() dto: ProductoCreateDTO): Promise<ProductoDetailResponseDTO> {
    return this.productosService.create(dto);
  }
}

// ============================================================================
// 2. DTO CON CLASS-VALIDATOR (TypeScript)
// ============================================================================
export class ProductoCreateDTO {
  @ApiProperty({ example: 'Leche Entera 1L' })
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Min(0)
  precioCosto: number;

  @ApiProperty({ example: 6000 })
  @IsNumber()
  @Min(0)
  precioVenta: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  idCategoria: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  idMarca: number;
}`;

  const dotNetCode = `// ============================================================================
// 1. CONTROLADOR ASP.NET CORE (C#)
// ============================================================================
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[Tags("Productos")]
public class ProductosController : ControllerBase
{
    private final IProductoService _service;

    public ProductosController(IProductoService service) => _service = service;

    [HttpGet]
    [ProducesResponseType(typeof(ProductoPageResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDTO), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Listar([FromQuery] ProductoFilterQuery query)
    {
        var result = await _service.ListarPaginadoAsync(query);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductoDetailResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponseDTO), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] ProductoCreateDTO dto)
    {
        var creado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(Listar), new { id = creado.IdProducto }, creado);
    }
}`;

  const currentCode =
    selectedTech === 'spring' ? springBootCode : selectedTech === 'nestjs' ? nestJsCode : dotNetCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
          <Terminal className="w-4 h-4" />
          <span>Traducción a Código de Backend</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          ¿Cómo se implementa este OpenAPI en tu Servidor?
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          OpenAPI es el contrato de diseño. En el backend, esto se traduce directamente en tus Controladores,
          DTOs de petición/respuesta y un Manejador Global de Excepciones para que las respuestas 400, 403 y 404
          se apliquen automáticamente en todos los endpoints sin repetir código.
        </p>
      </div>

      {/* Tech Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedTech('spring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTech === 'spring' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Java / Spring Boot 3
          </button>
          <button
            onClick={() => setSelectedTech('nestjs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTech === 'nestjs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Node.js / NestJS
          </button>
          <button
            onClick={() => setSelectedTech('dotnet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTech === 'dotnet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            C# / ASP.NET Core
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Código Copiado' : 'Copiar Código Backend'}</span>
        </button>
      </div>

      {/* Code Box */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
        <pre className="text-xs font-mono text-indigo-100/90 overflow-auto max-h-[600px] leading-relaxed">
          {currentCode}
        </pre>
      </div>
    </div>
  );
};
