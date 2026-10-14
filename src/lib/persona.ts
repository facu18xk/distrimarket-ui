import { ciError, completeRuc, formatPhone, normalizeCi, onlyDigits, phoneError, rucError } from './paraguay';
import type { PersonaRequestDTO, PersonaResponseDTO, TipoPersona } from '../types/api';

/** Los datos de persona tal como se editan en un formulario (todo texto). */
export interface PersonaForm {
  tipoPersona: TipoPersona;
  nombreCompleto: string;
  ci: string;
  ruc: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export const PERSONA_VACIA: PersonaForm = {
  tipoPersona: 'FISICA',
  nombreCompleto: '',
  ci: '',
  ruc: '',
  telefono: '',
  correo: '',
  direccion: '',
};

/**
 * Interpreta lo escrito en un buscador: un RUC, una cédula o un nombre.
 * Con una cédula ya se propone el RUC que le corresponde (cédula-verificador).
 */
export function personaDesdeTexto(texto: string): PersonaForm {
  const limpio = texto.trim();
  if (/^\d{5,8}-\d$/.test(limpio)) {
    const base = limpio.split('-')[0];
    // Los RUC que empiezan con 80 son de personas jurídicas.
    return base.startsWith('80')
      ? { ...PERSONA_VACIA, tipoPersona: 'JURIDICA', ruc: limpio }
      : { ...PERSONA_VACIA, ci: base, ruc: limpio };
  }
  if (/^[\d.\s]+$/.test(limpio) && onlyDigits(limpio)) {
    const ci = normalizeCi(limpio);
    return { ...PERSONA_VACIA, ci, ruc: completeRuc(ci) };
  }
  return { ...PERSONA_VACIA, nombreCompleto: limpio };
}

export function personaDesdeDto(persona: PersonaResponseDTO): PersonaForm {
  return {
    tipoPersona: persona.tipoPersona,
    nombreCompleto: persona.nombreCompleto,
    ci: persona.ci ?? '',
    ruc: persona.ruc ?? '',
    telefono: formatPhone(persona.telefono),
    correo: persona.correo ?? '',
    direccion: persona.direccion ?? '',
  };
}

/** El backend distingue "no viene" de "viene vacío": los opcionales vacíos no se envían. */
export function personaARequest(form: PersonaForm): PersonaRequestDTO {
  const opcional = (value: string) => value.trim() || undefined;
  return {
    tipoPersona: form.tipoPersona,
    nombreCompleto: form.nombreCompleto.trim().replace(/\s+/g, ' '),
    ci: opcional(normalizeCi(form.ci)),
    ruc: opcional(form.ruc),
    telefono: opcional(formatPhone(form.telefono)),
    correo: opcional(form.correo.toLowerCase()),
    direccion: opcional(form.direccion),
  };
}

export interface PersonaErrors {
  ci: string | null;
  ruc: string | null;
  telefono: string | null;
}

/**
 * Un RUC que ya estaba guardado no se vuelve a validar: solo se exige el
 * dígito verificador cuando se lo carga o se lo cambia.
 */
export function personaErrors(form: PersonaForm, rucOriginal?: string | null): PersonaErrors {
  return {
    ci: ciError(form.ci),
    ruc: rucOriginal != null && form.ruc === rucOriginal ? null : rucError(form.ruc),
    telefono: phoneError(form.telefono),
  };
}

export const hasPersonaErrors = (errors: PersonaErrors) => Object.values(errors).some(Boolean);
