import type { WayTheme } from '../lib/types';

export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/light-v11';

/* Earthy, warm route colors — feel like natural terrain */
export const wayThemeStyles: Record<
  WayTheme,
  { color: string; dashArray?: [number, number]; glowColor: string }
> = {
  hiking: { color: '#2D6A4F', glowColor: 'rgba(45, 106, 79, 0.30)' },
  wine: { color: '#9B2C2C', dashArray: [4, 2], glowColor: 'rgba(155, 44, 44, 0.30)' },
  coffee: { color: '#92400E', glowColor: 'rgba(146, 64, 14, 0.30)' },
  'ancient-town': { color: '#78716C', dashArray: [6, 3], glowColor: 'rgba(120, 113, 108, 0.30)' },
  cycling: { color: '#0A84FF', glowColor: 'rgba(10, 132, 255, 0.30)' },
  custom: { color: '#D97706', glowColor: 'rgba(217, 119, 6, 0.30)' },
};
