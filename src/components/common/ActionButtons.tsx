import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  showDelete = true,
}) => {
  return (
    <div className="flex items-center space-x-1 text-slate-400">
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          title="Ver detalles"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}

      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          title="Editar registro"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
      )}

      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          title="Eliminar o anular"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

