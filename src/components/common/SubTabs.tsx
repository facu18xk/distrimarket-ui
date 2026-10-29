import type { ComponentType, ReactNode } from 'react';
import { useApp } from '../../context/AppContext';

export interface SubTab<T extends string> {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface SubTabsProps<T extends string> {
  tabs: SubTab<T>[];
  value: T;
  onChange: (tab: T) => void;
  /** Botones de la pestaña activa ("+ Nuevo ..."), a la derecha. */
  actions?: ReactNode;
}

/** Barra de sub-pestañas de un módulo normalizada al estilo de tarjetas y tema de DistriMarket. */
export function SubTabs<T extends string>({ tabs, value, onChange, actions }: SubTabsProps<T>) {
  const { theme } = useApp();

  return (
    <div className="bg-white p-1 sm:p-1.5 rounded-2xl border border-slate-200 shadow-xs mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
      <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const isActive = value === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              style={
                isActive
                  ? {
                      backgroundColor: theme.primaryHex,
                      color: 'var(--user-on-primary-color, #FFF)',
                    }
                  : undefined
              }
              className={`py-1.5 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 select-none cursor-pointer ${
                isActive
                  ? 'shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${
                    isActive ? 'opacity-100 scale-105' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {actions && <div className="flex items-center space-x-2 shrink-0 px-1">{actions}</div>}
    </div>
  );
}
