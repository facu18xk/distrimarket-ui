import React, { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { esHexValido, hexAHsv, hsvAHex, textoSobre, type Hsv } from '../../lib/color';
import { cn } from '../../lib/utils';

interface ColorWheelProps {
  /** Color actual (hex). */
  value: string;
  /** Se llama con el color elegido, ya en hex ("#1E90FF"). */
  onChange: (hex: string) => void;
}

const TAMANO = 136;

/**
 * Selector de color como el de los programas de dibujo: rueda de tonos (alrededor) y saturación
 * (del centro al borde), barra de brillo y el código hex, que también se puede escribir o copiar.
 */
export const ColorWheel: React.FC<ColorWheelProps> = ({ value, onChange }) => {
  const [hsv, setHsv] = useState<Hsv>(() => hexAHsv(esHexValido(value) ? value : '#F97316'));
  const [texto, setTexto] = useState(value.toUpperCase());
  const [copiado, setCopiado] = useState(false);
  const rueda = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);

  const hex = hsvAHex(hsv);

  const aplicar = (nuevo: Hsv) => {
    setHsv(nuevo);
    const codigo = hsvAHex(nuevo);
    setTexto(codigo);
    onChange(codigo);
  };

  /** Punto de la rueda → tono (ángulo desde arriba, en sentido horario) y saturación (distancia al centro). */
  const desdePuntero = (event: React.PointerEvent<HTMLDivElement>) => {
    const caja = rueda.current?.getBoundingClientRect();
    if (!caja) return;
    const radio = caja.width / 2;
    const dx = event.clientX - (caja.left + radio);
    const dy = event.clientY - (caja.top + radio);
    const h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const s = Math.min(1, Math.hypot(dx, dy) / radio);
    aplicar({ h, s, v: hsv.v });
  };

  // Posición del marcador en la rueda.
  const angulo = (hsv.h * Math.PI) / 180;
  const marcadorX = TAMANO / 2 + Math.sin(angulo) * hsv.s * (TAMANO / 2);
  const marcadorY = TAMANO / 2 - Math.cos(angulo) * hsv.s * (TAMANO / 2);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el código igual queda a la vista para copiarlo a mano.
    }
  };

  const pocoContraste = textoSobre(hex) !== '#FFFFFF';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div
        ref={rueda}
        role="slider"
        aria-label="Tono y saturación"
        aria-valuenow={Math.round(hsv.h)}
        className="relative rounded-full shrink-0 cursor-crosshair touch-none shadow-inner"
        style={{
          width: TAMANO,
          height: TAMANO,
          background:
            'radial-gradient(circle closest-side, #FFFFFF, rgba(255,255,255,0)), conic-gradient(#FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
        }}
        onPointerDown={(e) => {
          arrastrando.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          desdePuntero(e);
        }}
        onPointerMove={(e) => arrastrando.current && desdePuntero(e)}
        onPointerUp={() => (arrastrando.current = false)}
      >
        {/* El brillo oscurece toda la rueda, igual que en los programas de dibujo. */}
        <div className="absolute inset-0 rounded-full bg-black pointer-events-none" style={{ opacity: 1 - hsv.v }} />
        <div
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: marcadorX, top: marcadorY, backgroundColor: hex }}
        />
      </div>

      <div className="flex-1 min-w-0 w-full space-y-2.5">
        <label className="block text-[11px] font-semibold text-slate-500">
          Brillo
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(hsv.v * 100)}
            onChange={(e) => aplicar({ ...hsv, v: Number(e.target.value) / 100 })}
            className="w-full mt-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #000000, ${hsvAHex({ ...hsv, v: 1 })})` }}
          />
        </label>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: hex }} />
          <input
            className={cn(
              'flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-mono uppercase',
              esHexValido(texto) ? 'border-slate-200' : 'border-rose-400'
            )}
            value={texto}
            maxLength={7}
            onChange={(e) => {
              const escrito = e.target.value.toUpperCase();
              setTexto(escrito);
              if (esHexValido(escrito)) {
                const codigo = escrito.startsWith('#') ? escrito : `#${escrito}`;
                setHsv(hexAHsv(codigo));
                onChange(codigo);
              }
            }}
            aria-label="Código del color"
          />
          <button
            type="button"
            onClick={copiar}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Copiar código"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {pocoContraste && (
          <p className="text-[11px] text-slate-500">Color claro: el texto sobre él (encabezado y botones) se mostrará en negro.</p>
        )}
      </div>
    </div>
  );
};
