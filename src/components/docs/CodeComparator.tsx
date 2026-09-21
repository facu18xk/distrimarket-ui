import React, { useState } from 'react';
import { ORIGINAL_OPENAPI_YAML, IMPROVED_OPENAPI_YAML } from '../../data/openApiContent';
import { Copy, Check, Search, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export const CodeComparator: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'side-by-side' | 'improved' | 'original'>('side-by-side');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const copyText = (text: string, isImproved: boolean) => {
    navigator.clipboard.writeText(text);
    if (isImproved) {
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 2000);
    } else {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    }
  };

  const improvementsList = [
    {
      title: 'Tags globales con descripción',
      desc: 'Ahora Swagger UI agrupa y documenta claramente qué hace el módulo Productos.',
      status: 'added'
    },
    {
      title: 'Solución del schema fantasma ProductoPageResponseDTO',
      desc: 'Se define formalmente combinando BasePageResponse con arreglo de productos.',
      status: 'fixed'
    },
    {
      title: 'Paginación segura (minimum/maximum) y SortQuery',
      desc: 'Protege contra colapso de RAM (máximo 100 elementos) y permite ordenar por cualquier campo.',
      status: 'added'
    },
    {
      title: 'Filtros de negocio modulares',
      desc: 'Filtros por nombre, categoría, marca, estado y rangos de precio en components/parameters.',
      status: 'added'
    },
    {
      title: 'Respuestas de error reutilizables (400, 401, 403, 404, 409, 500)',
      desc: 'En components/responses con schema estándar ErrorResponseDTO (RFC 7807 compatible).',
      status: 'added'
    },
    {
      title: 'Separación de DTOs (Create, Update, Summary, Detail)',
      desc: 'Ahorro de ancho de banda en tablas y validaciones estrictas al registrar o editar.',
      status: 'added'
    },
    {
      title: 'CRUD completo (/productos/{idProducto})',
      desc: 'Agregadas las operaciones GET individual, PUT para editar y DELETE para baja lógica (204).',
      status: 'added'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Checklist of Improvements */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Auditoría y Mejoras de Arquitectura</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Comparativa Directa de openapi.yml
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Observa punto por punto cómo se solucionaron los vacíos técnicos del contrato inicial,
          convirtiéndolo en una especificación lista para producción en equipos enterprise.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {improvementsList.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start space-x-2.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedView('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lado a Lado
          </button>
          <button
            onClick={() => setSelectedView('improved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'improved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo Mejorado (v1.1.0)
          </button>
          <button
            onClick={() => setSelectedView('original')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo Original (Compañero)
          </button>
        </div>

        {/* Copy improved action */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => copyText(IMPROVED_OPENAPI_YAML, true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            {copiedImproved ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedImproved ? '¡Copiado!' : 'Copiar openapi.yml Mejorado'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(selectedView === 'side-by-side' || selectedView === 'original') && (
          <div className={`space-y-2 ${selectedView === 'original' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold text-slate-300">Versión Inicial (Compañero)</span>
                <span className="text-[10px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                  Faltan respuestas de error & schema roto
                </span>
              </div>
              <button
                onClick={() => copyText(ORIGINAL_OPENAPI_YAML, false)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
              >
                {copiedOriginal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedOriginal ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-auto max-h-[600px] leading-relaxed">
              {ORIGINAL_OPENAPI_YAML}
            </pre>
          </div>
        )}

        {(selectedView === 'side-by-side' || selectedView === 'improved') && (
          <div className={`space-y-2 ${selectedView === 'improved' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-300">Versión Mejorada y Completa (v1.1.0)</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                  Listo para producción
                </span>
              </div>
              <button
                onClick={() => copyText(IMPROVED_OPENAPI_YAML, true)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
              >
                {copiedImproved ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedImproved ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/30 text-xs font-mono text-emerald-100/90 overflow-auto max-h-[600px] leading-relaxed">
              {IMPROVED_OPENAPI_YAML}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
