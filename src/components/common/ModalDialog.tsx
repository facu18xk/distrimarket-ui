import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { cn } from '../../lib/utils';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Los formularios largos usan un modal ancho para repartir los campos en columnas y evitar scroll. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
  bodyClassName?: string;
}

const ANCHOS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  '6xl': 'sm:max-w-6xl',
  '7xl': 'sm:max-w-7xl',
  full: 'sm:max-w-[96vw]',
} as const;

/**
 * Modal de la aplicación. Nunca es más ancho ni más alto que la pantalla: en un teléfono deja un
 * margen chico a los costados, y si el contenido no entra en alto, solo se desplaza el cuerpo
 * (el título queda fijo). Nunca hay scroll horizontal.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  className,
  bodyClassName,
}) => (
  <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    {/* Un clic fuera no cierra el modal: no se pierde un formulario a medio cargar. Se cierra con la X, Cancelar o Esc. */}
    <DialogContent
      className={cn(
        'p-0 gap-0 overflow-hidden flex flex-col w-[calc(100vw-1rem)] max-w-none max-h-[calc(100dvh-1rem)]',
        ANCHOS[maxWidth],
        className
      )}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogHeader className="px-4 sm:px-6 py-3 sm:py-3.5 pr-12 border-b border-slate-100 bg-slate-50/50 shrink-0 text-left">
        <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">{title}</DialogTitle>
        {subtitle ? (
          <DialogDescription className="text-xs text-slate-500 mt-0.5">{subtitle}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">Detalles del diálogo</DialogDescription>
        )}
      </DialogHeader>
      <div className={cn('px-4 py-3 sm:px-6 sm:py-5 overflow-y-auto overflow-x-hidden min-h-0 flex-1', bodyClassName)}>{children}</div>
    </DialogContent>
  </Dialog>
);
