import { FormField, fieldClass } from './FormControls';
import { completeRuc, formatCi, formatPhone, formatRuc, maskRuc, normalizeCi } from '../../lib/paraguay';
import type { PersonaErrors, PersonaForm } from '../../lib/persona';
import type { TipoPersona } from '../../types/api';

interface PersonaFieldsProps {
  value: PersonaForm;
  onChange: (value: PersonaForm) => void;
  errors: PersonaErrors;
  /** true = mostrar todos los errores (después de intentar guardar). */
  showAllErrors: boolean;
}

/**
 * Campos de una persona (cliente, proveedor...) con las reglas de Paraguay:
 * cédula con puntos, RUC con dígito verificador y teléfono en formato nacional.
 * En una persona física, el RUC acompaña a la cédula mientras no se lo edite a mano.
 */
export function PersonaFields({ value, onChange, errors, showAllErrors }: PersonaFieldsProps) {
  const set = (changes: Partial<PersonaForm>) => onChange({ ...value, ...changes });
  const esFisica = value.tipoPersona === 'FISICA';
  const error = (field: keyof PersonaErrors) => {
    const message = showAllErrors || value[field] ? errors[field] : null;
    return message && <p className="text-[11px] text-rose-600 mt-1">{message}</p>;
  };

  const cambiarCi = (texto: string) => {
    const ci = normalizeCi(texto);
    // El RUC sigue a la cédula solo si estaba vacío o era el que se había propuesto.
    const rucAutomatico = value.ruc === '' || value.ruc === completeRuc(value.ci);
    set({ ci, ruc: esFisica && rucAutomatico ? (ci.length >= 5 ? completeRuc(ci) : '') : value.ruc });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo de persona" required>
          <select className={fieldClass} value={value.tipoPersona} onChange={(e) => set({ tipoPersona: e.target.value as TipoPersona })}>
            <option value="FISICA">Física</option>
            <option value="JURIDICA">Jurídica</option>
          </select>
        </FormField>
        <FormField label={esFisica ? 'Nombre y apellido' : 'Razón social'} required>
          <input
            className={fieldClass}
            required
            maxLength={150}
            value={value.nombreCompleto}
            onChange={(e) => set({ nombreCompleto: e.target.value })}
            autoFocus={!value.nombreCompleto}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Cédula de identidad" required={esFisica}>
          <input
            className={fieldClass}
            required={esFisica}
            inputMode="numeric"
            value={formatCi(value.ci)}
            onChange={(e) => cambiarCi(e.target.value)}
            placeholder="4.123.456"
          />
          {error('ci')}
        </FormField>
        <FormField label="RUC" required={!esFisica} hint={esFisica ? 'Se completa solo a partir de la cédula.' : undefined}>
          <input
            className={fieldClass}
            required={!esFisica}
            value={formatRuc(value.ruc)}
            onChange={(e) => set({ ruc: maskRuc(e.target.value) })}
            // Al salir con solo la base escrita, se completa el dígito verificador.
            onBlur={() => /^\d{5,8}$/.test(value.ruc) && set({ ruc: completeRuc(value.ruc) })}
            placeholder="80.012.345-0"
          />
          {error('ruc')}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Teléfono">
          <input
            className={fieldClass}
            type="tel"
            inputMode="tel"
            value={value.telefono}
            onChange={(e) => set({ telefono: e.target.value.replace(/[^\d+\s]/g, '') })}
            onBlur={() => set({ telefono: formatPhone(value.telefono) })}
            placeholder="0981 123 456"
          />
          {error('telefono')}
        </FormField>
        <FormField label="Correo">
          <input
            className={fieldClass}
            type="email"
            maxLength={100}
            value={value.correo}
            onChange={(e) => set({ correo: e.target.value.trim() })}
            placeholder="nombre@correo.com"
          />
        </FormField>
      </div>

      <FormField label="Dirección">
        <input className={fieldClass} maxLength={200} value={value.direccion} onChange={(e) => set({ direccion: e.target.value })} />
      </FormField>
    </>
  );
}
