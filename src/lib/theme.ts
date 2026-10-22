import type { ThemeConfig } from '../types/distrimarket';

/** Colores de la interfaz que cada usuario puede elegir (preferencia visual, no datos de negocio). */
export const THEME_PALETTES: ThemeConfig[] = [
  {
    colorId: 'orange',
    colorName: 'Naranja DistriMarket (Figma)',
    primaryHex: '#F97316',
    hoverHex: '#EA580C',
    lightBgHex: '#FFF7ED',
    isDark: false,
  },
  {
    colorId: 'blue',
    colorName: 'Azul Corporativo',
    primaryHex: '#2563EB',
    hoverHex: '#1D4ED8',
    lightBgHex: '#EFF6FF',
    isDark: false,
  },
  {
    colorId: 'emerald',
    colorName: 'Verde Esmeralda',
    primaryHex: '#059669',
    hoverHex: '#047857',
    lightBgHex: '#ECFDF5',
    isDark: false,
  },
  {
    colorId: 'purple',
    colorName: 'Violeta Royal',
    primaryHex: '#7C3AED',
    hoverHex: '#6D28D9',
    lightBgHex: '#F5F3FF',
    isDark: false,
  },
  {
    colorId: 'rose',
    colorName: 'Rosa Carmesí',
    primaryHex: '#E11D48',
    hoverHex: '#BE123C',
    lightBgHex: '#FFF1F2',
    isDark: false,
  },
  {
    colorId: 'slate',
    colorName: 'Gris Grafito Minimalista',
    primaryHex: '#334155',
    hoverHex: '#1E293B',
    lightBgHex: '#F8FAFC',
    isDark: false,
  },
];

/** Fotos de perfil sugeridas; cada usuario guarda la suya en su navegador. */
export const AVATAR_OPTIONS = [
  { id: '1', name: 'Avatar 1 (Anime)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Avatar 2 (Juan Ejecutivo)', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Avatar 3 (Ilustración Estilo Figma)', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Avatar 4 (Profesional Moderna)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' }
];
