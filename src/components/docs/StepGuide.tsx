import React, { useState } from 'react';
import { STEPS_DATA } from '../../data/openApiContent';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  FileCode,
  Tag,
  Filter
} from 'lucide-react';

interface StepGuideProps {
  onGoToSimulator: () => void;
}

export const StepGuide: React.FC<StepGuideProps> = ({ onGoToSimulator }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS_DATA[currentStepIndex];

  return (
    <div className="space-y-6">
      {/* Intro hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Ruta de Aprendizaje Modular • DistriMarket API</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            De Principiante a Experto en OpenAPI 3.0 & DTOs
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Aprende a desglosar el código que dejó tu compañero, arregla los errores ocultos, agrega
            paginación segura con filtros reales, y domina la reutilización global de errores (403, 404, 400).
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags explicados a fondo</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>DTOs & Composición allOf</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reutilización 403 / 404</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Paginación + Filtros</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Steps Bar on the left / top, Step Content on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Pasos de la Transformación
            </h2>
            <div className="space-y-1.5">
              {STEPS_DATA.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                return (
                  <button
                    key={step.id}
                    id={`step-nav-${step.number}`}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/40 text-white shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {step.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{step.subtitle}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 self-center" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick interactive shortcut card */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold mb-1">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Aprende experimentando</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Puedes probar en vivo las respuestas simuladas de 200, 400, 403 y 404 directamente en el simulador.
            </p>
            <button
              id="btn-goto-simulator"
              onClick={onGoToSimulator}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <span>Abrir Simulador de Respuestas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Detail Content Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Step Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Paso {currentStep.number} de {STEPS_DATA.length}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {currentStep.badge}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{currentStep.title}</h2>
              <p className="text-sm font-medium text-indigo-300 mt-1">{currentStep.subtitle}</p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">{currentStep.summary}</p>
            </div>

            {/* Why section (Motivos y Justificación) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>¿Por qué se hace? (Motivos detrás de esta parte)</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {currentStep.why.map((reason, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {rIdx + 1}
                    </span>
                    <span className="leading-relaxed">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How section (Cómo lo implementamos) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¿Cómo lo hacemos paso a paso?</span>
              </h3>
              <ul className="space-y-2">
                {currentStep.how.map((action, aIdx) => (
                  <li key={aIdx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                    <span className="text-emerald-400 font-bold mr-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code Comparison Card */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Cambio en el código YAML</span>
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentStep.currentCodeSnippet && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                      <span>Antes (Código actual con limitaciones)</span>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-200 text-xs font-mono overflow-x-auto leading-relaxed">
                      {currentStep.currentCodeSnippet}
                    </pre>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span>Después (Solución con Buenas Prácticas)</span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 text-xs font-mono overflow-x-auto leading-relaxed">
                    {currentStep.improvedCodeSnippet}
                  </pre>
                </div>
              </div>
            </div>

            {/* Key Takeaway Callout */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Regla de Oro</h4>
                <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">{currentStep.keyTakeaway}</p>
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                id="btn-prev-step"
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentStepIndex === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-500 bg-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {currentStepIndex + 1} de {STEPS_DATA.length}
              </span>

              {currentStepIndex < STEPS_DATA.length - 1 ? (
                <button
                  id="btn-next-step"
                  onClick={() => setCurrentStepIndex((prev) => Math.min(STEPS_DATA.length - 1, prev + 1))}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950 transition-all"
                >
                  <span>Siguiente Paso</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-finish-guide"
                  onClick={onGoToSimulator}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                >
                  <span>¡Probar en el Simulador!</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
