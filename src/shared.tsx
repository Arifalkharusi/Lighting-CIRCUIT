import type { CoreColor } from '../../types';

// Shared handle (terminal pin) styling used by every node
export const HS = "!w-4 !h-4 !border-2 !border-slate-950 !shadow-sm !relative !left-0 !top-0 !transform-none cursor-pointer hover:!scale-110 transition-transform z-50";

export const CORE_COLOR_HEX: Record<CoreColor, string> = {
  Brown: '#b45309',
  Blue: '#3b82f6',
  GreenYellow: '#10b981',
  Yellow: '#eab308',
  Black: '#27272a',
  Grey: '#9ca3af',
};

// Small reusable "card frame" classnames so every node shares the same
// redesigned look: a slate body, copper-accented header, subtle inner border.
export const cardFrame = (accent: string) =>
  `bg-slate-900 border-2 ${accent} rounded-xl shadow-2xl relative`;
