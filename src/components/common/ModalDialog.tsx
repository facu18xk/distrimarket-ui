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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Un clic fuera no cierra el modal: no se pierde un formulario a medio cargar. Se cierra con la X, Cancelar o Esc. */}
      <DialogContent
        className={cn("p-0 overflow-hidden gap-0", maxWidthClasses)}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
          {subtitle ? (
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Detalles del diálogo</DialogDescription>
          )}
        </DialogHeader>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

