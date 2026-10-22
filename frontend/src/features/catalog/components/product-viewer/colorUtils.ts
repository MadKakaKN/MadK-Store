import { ProductVariantDto } from '../../../../types/catalog';

export interface ColorOption {
  name: string;
  hex: string;
  cssBg: string;
}

export const COMMON_COLORS: Record<string, string> = {
  // Whites / Creams
  white: '#F8FAFC',
  trắng: '#F8FAFC',
  ceramic: '#F1F5F9',
  silver: '#E2E8F0',
  bạc: '#E2E8F0',

  // Blacks / Dark Greys
  black: '#1E293B',
  đen: '#1E293B',
  dark: '#0F172A',
  carbon: '#18181B',
  'space grey': '#334155',
  'space gray': '#334155',
  xám: '#475569',
  grey: '#475569',
  gray: '#475569',

  // Titanium
  titan: '#78716C',
  titanium: '#78716C',
  'titan tự nhiên': '#A8A29E',
  'natural titanium': '#A8A29E',
  'titan đen': '#292524',
  'titan xanh': '#334155',

  // Blues
  blue: '#3B82F6',
  xanh: '#2563EB',
  navy: '#1D4ED8',
  midnight: '#1E1B4B',
  cyan: '#06B6D4',

  // Reds / Pinks
  red: '#EF4444',
  đỏ: '#DC2626',
  crimson: '#991B1B',
  pink: '#EC4899',
  hồng: '#DB2777',
  rose: '#F43F5E',

  // Greens
  green: '#10B981',
  lục: '#059669',
  emerald: '#047857',
  mint: '#6EE7B7',

  // Yellows / Golds
  gold: '#F59E0B',
  vàng: '#D97706',
  amber: '#B45309',
  yellow: '#EAB308',

  // Purples
  purple: '#8B5CF6',
  tím: '#7C3AED',
  violet: '#6D28D9',
};

/**
 * Extracts a representative hex color from variant attributes or name.
 */
export function extractVariantColor(variant?: ProductVariantDto | null): { name: string; hex: string } {
  if (!variant) {
    return { name: 'Mặc định', hex: '#4F46E5' }; // Brand indigo
  }

  // 1. Try to read from JSON attributes if available
  if (variant.attributes) {
    try {
      const attrs = JSON.parse(variant.attributes);
      const colorVal = attrs.color || attrs.Color || attrs.màu || attrs.Mau || attrs.colour;
      if (colorVal && typeof colorVal === 'string') {
        const lower = colorVal.toLowerCase().trim();
        for (const [key, hex] of Object.entries(COMMON_COLORS)) {
          if (lower.includes(key)) {
            return { name: colorVal, hex };
          }
        }
        return { name: colorVal, hex: '#3B82F6' };
      }
    } catch {
      // Attributes was not valid JSON, proceed to inspect name
    }
  }

  // 2. Inspect variant name
  const nameLower = variant.name.toLowerCase();
  for (const [key, hex] of Object.entries(COMMON_COLORS)) {
    if (nameLower.includes(key)) {
      return { name: variant.name, hex };
    }
  }

  // Fallback based on variant SKU or default
  return { name: variant.name, hex: '#4F46E5' };
}

export const PRESET_3D_PALETTE: ColorOption[] = [
  { name: 'Đen Carbon', hex: '#1E293B', cssBg: 'bg-slate-900' },
  { name: 'Trắng Ceramic', hex: '#F8FAFC', cssBg: 'bg-slate-100' },
  { name: 'Xám Titan', hex: '#78716C', cssBg: 'bg-stone-500' },
  { name: 'Xanh Midnight', hex: '#1E1B4B', cssBg: 'bg-indigo-950' },
  { name: 'Đỏ Crimson', hex: '#EF4444', cssBg: 'bg-rose-500' },
  { name: 'Tím Neon', hex: '#8B5CF6', cssBg: 'bg-purple-500' },
];
