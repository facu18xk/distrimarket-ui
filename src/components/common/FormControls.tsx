import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

/** Estilo único de input, select y textarea en formularios. */
export const fieldClass =
  'w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed';

interface FormFieldProps {
  label: string;
  required?: boolean;
  /** Ayuda corta debajo del campo. */
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Etiqueta + control, con el mismo espaciado en todos los formularios. */
export function FormField({ label, required = false, hint, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {required && ' *'}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

interface FeedbackBannerProps {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}

const BANNER = {
  error: { icon: AlertTriangle, classes: 'bg-rose-50 border-rose-200 text-rose-700' },
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  info: { icon: Info, classes: 'bg-slate-50 border-slate-200 text-slate-600' },
} as const;

/** Mensaje al usuario; con `error` muestra tal cual lo que respondió el backend. */
export function FeedbackBanner({ variant = 'error', children, className }: FeedbackBannerProps) {
  const { icon: Icon, classes } = BANNER[variant];
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-medium', classes, className)} role="alert">
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

/** Pie de formulario: Cancelar + botón principal con el color del tema. */
export function FormActions({ onCancel, submitLabel, loading = false, disabled = false, icon }: FormActionsProps) {
  const { theme } = useApp();
  return (
    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading || disabled}
        style={{ backgroundColor: theme.primaryHex }}
        className="sobre-primario px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        <span>{loading ? 'Guardando...' : submitLabel}</span>
      </button>
    </div>
  );
}
