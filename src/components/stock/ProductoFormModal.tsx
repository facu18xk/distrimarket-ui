import React, { useCallback, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import {
  CampoNumero,
  DepositoBuscador,
  FeedbackBanner,
  FormActions,
  FormField,
  ModalDialog,
  fieldClass,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData } from '../../hooks';
import { catalogos, depositosActivos, errorMessage, inventarioApi } from '../../services';
import { cn } from '../../lib/utils';
import type { DepositoResponseDTO, ProductoRequestDTO, ProductoResponseDTO } from '../../types/api';

async function cargarClasificaciones() {
  const [categorias, marcas] = await Promise.all([catalogos.categorias(), catalogos.marcas()]);
  return { categorias, marcas };
}

const VACIO = {
  nombre: '',
  codigoBarra: '',
  descripcion: '',
  precioCosto: '',
  precioVenta: '',
  porcentajeIva: '10',
  stockMinimo: '0',
  idCategoria: '',
  idMarca: '',
};

interface FilaExistencia {
  key: number;
  deposito: DepositoResponseDTO | null;
  cantidad: string;
}

let siguienteFila = 1;
const nuevaFila = (): FilaExistencia => ({ key: siguienteFila++, deposito: null, cantidad: '' });

async function cargarFormulario(permitirStockInicial: boolean) {
  if (permitirStockInicial) {
    const [clasificaciones, depositos] = await Promise.all([cargarClasificaciones(), depositosActivos()]);
    return { ...clasificaciones, depositos };
  }
  const clasificaciones = await cargarClasificaciones();
  return { ...clasificaciones, depositos: [] };
}

export interface ProductoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (producto: ProductoResponseDTO) => void;
  permitirStockInicial?: boolean;
}

export const ProductoFormModal: React.FC<ProductoFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  permitirStockInicial = true,
}) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title="Nuevo producto"
    subtitle={
      permitirStockInicial
        ? 'Puede cargar desde aquí la cantidad inicial en cada depósito.'
        : 'Complete los datos del producto para agregarlo a la compra.'
    }
    maxWidth={permitirStockInicial ? '4xl' : 'lg'}
  >
    <ProductoForm onClose={onClose} onSaved={onSaved} permitirStockInicial={permitirStockInicial} />
  </ModalDialog>
);

interface ProductoFormProps {
  onClose: () => void;
  onSaved: (producto: ProductoResponseDTO) => void;
  permitirStockInicial?: boolean;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  onClose,
  onSaved,
  permitirStockInicial = true,
}) => {
  // El loader debe ser estable: una flecha nueva en cada render reinicia la carga sin fin.
  const cargar = useCallback(() => cargarFormulario(permitirStockInicial), [permitirStockInicial]);
  const datos = useAsyncData(cargar);
  const guardar = useAsyncAction();
  const [form, setForm] = useState(VACIO);
  const [filas, setFilas] = useState<FilaExistencia[]>([]);
  const [creado, setCreado] = useState<ProductoResponseDTO | null>(null);
  const [cargados, setCargados] = useState<number[]>([]);
  const [fallas, setFallas] = useState<string[]>([]);
  const set = (cambios: Partial<typeof VACIO>) => setForm((actual) => ({ ...actual, ...cambios }));

  const precioMenorAlCosto =
    form.precioCosto !== '' && form.precioVenta !== '' && Number(form.precioVenta) < Number(form.precioCosto);

  const cambiarFila = (key: number, cambios: Partial<FilaExistencia>) =>
    setFilas((actuales) => actuales.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  const quitarFila = (key: number) => setFilas((actuales) => actuales.filter((f) => f.key !== key));
  const elegidos = filas.flatMap((f) => (f.deposito ? [f.deposito.id] : []));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datos.data) return;
    const request: ProductoRequestDTO = {
      nombre: form.nombre.trim(),
      codigoBarra: form.codigoBarra.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      precioCosto: Number(form.precioCosto),
      precioVenta: Number(form.precioVenta),
      porcentajeIva: Number(form.porcentajeIva),
      stockMinimo: Number(form.stockMinimo),
      idCategoria: Number(form.idCategoria),
      idMarca: Number(form.idMarca),
    };

    const pendientes = permitirStockInicial
      ? filas.filter((f) => f.deposito && Number(f.cantidad) > 0 && !cargados.includes(f.deposito.id))
      : [];
    const errores: string[] = [];
    let productoResultado: ProductoResponseDTO | null = creado;

    const ok = await guardar.run(async () => {
      let producto = creado;
      if (!producto) {
        producto = await inventarioApi.productos.create(request);
        setCreado(producto);
        productoResultado = producto;
      }
      if (permitirStockInicial) {
        for (const { deposito, cantidad } of pendientes) {
          if (!deposito) continue;
          try {
            await inventarioApi.stock.create({
              idProducto: producto.id,
              idDeposito: deposito.id,
              cantidad: Number(cantidad),
            });
            setCargados((actuales) => [...actuales, deposito.id]);
          } catch (error) {
            errores.push(`${deposito.nombre}: ${errorMessage(error)}`);
          }
        }
      }
    });
    if (!ok || !productoResultado) return;

    setFallas(errores);
    onSaved(productoResultado);
    if (errores.length === 0) onClose();
  };

  if (datos.error) return <FeedbackBanner>{datos.error}</FeedbackBanner>;
  if (!datos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { categorias, marcas, depositos } = datos.data;
  const bloqueado = Boolean(creado);

  const camposProducto = (
    <fieldset disabled={bloqueado} className="space-y-3">
      <FormField label="Nombre" required>
        <input
          className={fieldClass}
          required
          maxLength={150}
          value={form.nombre}
          onChange={(e) => set({ nombre: e.target.value })}
          autoFocus
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Categoría" required>
          <select
            className={fieldClass}
            required
            value={form.idCategoria}
            onChange={(e) => set({ idCategoria: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Marca" required>
          <select
            className={fieldClass}
            required
            value={form.idMarca}
            onChange={(e) => set({ idMarca: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Precio de costo (Gs.)" required>
          <CampoNumero prefijo="Gs." min={0} required value={form.precioCosto === '' ? null : Number(form.precioCosto)} onChange={(v) => set({ precioCosto: v === null ? '' : String(v) })} />
        </FormField>
        <FormField label="Precio de venta (Gs.)" required>
          <CampoNumero prefijo="Gs." min={0} required value={form.precioVenta === '' ? null : Number(form.precioVenta)} onChange={(v) => set({ precioVenta: v === null ? '' : String(v) })} />
        </FormField>
        <FormField label="IVA" required>
          <select
            className={fieldClass}
            value={form.porcentajeIva}
            onChange={(e) => set({ porcentajeIva: e.target.value })}
          >
            <option value="10">10%</option>
            <option value="5">5%</option>
            <option value="0">Exento</option>
          </select>
        </FormField>
      </div>

      {precioMenorAlCosto && (
        <FeedbackBanner variant="info">El precio de venta es menor que el de costo.</FeedbackBanner>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código de barras">
          <input
            className={fieldClass}
            inputMode="numeric"
            maxLength={20}
            value={form.codigoBarra}
            onChange={(e) => set({ codigoBarra: e.target.value.replace(/\D/g, '') })}
          />
        </FormField>
        <FormField label="Stock mínimo" required hint="Cantidad a partir de la cual conviene reponer.">
          <input
            className={fieldClass}
            type="number"
            min={0}
            required
            value={form.stockMinimo}
            onChange={(e) => set({ stockMinimo: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Descripción">
        <input
          className={fieldClass}
          maxLength={255}
          value={form.descripcion}
          onChange={(e) => set({ descripcion: e.target.value })}
        />
      </FormField>
    </fieldset>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {permitirStockInicial ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {camposProducto}

          {/* Existencia inicial: filas que se agregan como las líneas de una factura */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Existencia inicial ({filas.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilas((actuales) => [...actuales, nuevaFila()])}
                disabled={depositos.length === 0}
              >
                <Plus />
                <span>Agregar depósito</span>
              </Button>
            </div>

            {filas.length === 0 ? (
              <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl px-3 py-2">
                {depositos.length === 0
                  ? 'No hay depósitos activos.'
                  : 'Sin existencia inicial: el producto se crea sin stock. Use "Agregar depósito" para cargarla.'}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Depósito</th>
                      <th className="py-2 px-3 w-28 text-center">Cantidad</th>
                      <th className="py-2 px-3 w-10 text-center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filas.map((fila) => {
                      const listo = fila.deposito !== null && cargados.includes(fila.deposito.id);
                      return (
                        <tr key={fila.key}>
                          <td className="py-1.5 px-2 min-w-48">
                            <DepositoBuscador
                              required
                              disabled={listo}
                              depositos={depositos}
                              value={fila.deposito}
                              onChange={(deposito) => cambiarFila(fila.key, { deposito })}
                              excluir={elegidos.filter((id) => id !== fila.deposito?.id)}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            {listo ? (
                              <span className="block text-center text-emerald-700 font-semibold">
                                Cargado: {fila.cantidad}
                              </span>
                            ) : (
                              <input
                                className={cn(fieldClass, 'text-center')}
                                type="number"
                                min={1}
                                required
                                value={fila.cantidad}
                                onChange={(e) => cambiarFila(fila.key, { cantidad: e.target.value })}
                              />
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            {!listo && (
                              <button
                                type="button"
                                onClick={() => quitarFila(fila.key)}
                                className="text-slate-400 hover:text-rose-600"
                                title="Quitar depósito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        camposProducto
      )}

      {creado && fallas.length > 0 && (
        <FeedbackBanner>
          El producto "{creado.nombre}" se creó, pero no se pudo cargar la existencia en: {fallas.join('; ')}. Puede
          corregir esas filas y reintentar.
        </FeedbackBanner>
      )}
      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={creado ? 'Reintentar existencias' : 'Crear producto'}
        loading={guardar.loading}
        icon={<PackagePlus className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
