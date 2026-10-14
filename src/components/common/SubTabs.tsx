import type { ReactNode } from 'react';

export interface SubTab<T extends string> {
  id: T;
  label: string;
}

interface SubTabsProps<T extends string> {
  tabs: SubTab<T>[];
  value: T;
  onChange: (tab: T) => void;
  /** Botones de la pestaña activa ("+ Nuevo ..."), a la derecha. */
  actions?: ReactNode;
}

/** Barra de sub-pestañas de un módulo, con sus acciones a la derecha. */
export function SubTabs<T extends string>({ tabs, value, onChange, actions }: SubTabsProps<T>) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6 print:hidden">
      <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              value === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actions && <div className="flex items-center space-x-2.5">{actions}</div>}
    </div>
  );
}
