import React from 'react';
import { Badge } from '../ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.trim().toLowerCase();

  // Green statuses (Óptimo, Completado, Recibida, Activo, Activa)
  if (['óptimo', 'optimo', 'completado', 'completada', 'recibida', 'activo', 'activa'].includes(normalized)) {
    return <Badge variant="success">{status}</Badge>;
  }

  // Red / Danger statuses (Crítico, Cancelado, Cancelada, Anulada, Inactivo, Vencida)
  if (['crítico', 'critico', 'cancelado', 'cancelada', 'anulada', 'inactivo', 'vencida'].includes(normalized)) {
    return <Badge variant="destructive">{status}</Badge>;
  }

  // Orange / Yellow / Warning statuses (Bajo, Pendiente, Programada)
  if (['bajo', 'pendiente', 'programada'].includes(normalized)) {
    return <Badge variant="warning">{status}</Badge>;
  }

  // Client tags
  if (normalized === 'frecuente') {
    return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Frecuente</Badge>;
  }

  if (normalized === 'delivery') {
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Delivery</Badge>;
  }

  if (normalized === 'ocasional') {
    return <Badge variant="secondary">Ocasional</Badge>;
  }

  if (normalized === 'nuevo') {
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Nuevo</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
};

