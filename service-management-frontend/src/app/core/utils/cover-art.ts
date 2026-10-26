/**
 * Illustrations génératives : les services n'ont pas d'image, on en dessine une, de façon déterministe,
 * à partir de leur catégorie (palette) et de leur titre (composition).
 * Même entrée = même visuel, partout dans l'application.
 */

export interface CoverPalette {
  bg: string;
  a: string;
  b: string;
  c: string;
  /** Couleur de texte lisible sur `bg`. */
  onBg: string;
}

export const PALETTES: CoverPalette[] = [
  { bg: '#5B3DF5', a: '#FFC83D', b: '#FF6B57', c: '#FFFFFF', onBg: '#FFFFFF' },
  { bg: '#FF6B57', a: '#1A1740', b: '#FFC83D', c: '#FFF1EC', onBg: '#1A1740' },
  { bg: '#12A38A', a: '#FFC83D', b: '#1A1740', c: '#D9FFF6', onBg: '#FFFFFF' },
  { bg: '#FFC83D', a: '#5B3DF5', b: '#FF6B57', c: '#1A1740', onBg: '#1A1740' },
  { bg: '#2D6BFF', a: '#FF9FD0', b: '#FFC83D', c: '#FFFFFF', onBg: '#FFFFFF' },
  { bg: '#FF8FC7', a: '#5B3DF5', b: '#1A1740', c: '#FFFFFF', onBg: '#1A1740' },
  { bg: '#1A1740', a: '#FFC83D', b: '#8E7BFF', c: '#FF6B57', onBg: '#FFFFFF' },
  { bg: '#7BD88F', a: '#1A1740', b: '#5B3DF5', c: '#FFF8D6', onBg: '#1A1740' },
  { bg: '#8E7BFF', a: '#FFC83D', b: '#1A1740', c: '#FFFFFF', onBg: '#1A1740' },
  { bg: '#0F766E', a: '#7BD88F', b: '#FFC83D', c: '#FFFFFF', onBg: '#FFFFFF' },
  { bg: '#F43F8F', a: '#FFC83D', b: '#1A1740', c: '#FFE3F1', onBg: '#FFFFFF' },
  { bg: '#FF9F1C', a: '#1A1740', b: '#FFFFFF', c: '#5B3DF5', onBg: '#1A1740' },
];

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Palette liée à la catégorie (insensible à la casse et aux espaces) : une catégorie = une couleur. */
export function paletteFor(category: string): CoverPalette {
  return PALETTES[hashString(category.trim().toLowerCase()) % PALETTES.length];
}

export type CoverShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: string; transform: string }
  | { kind: 'path'; d: string; fill: string; transform: string }
  | { kind: 'polygon'; points: string; fill: string; transform: string };

export interface Cover {
  palette: CoverPalette;
  shapes: CoverShape[];
}

const W = 400;
const H = 240;

export function buildCover(seed: string, category: string): Cover {
  const palette = paletteFor(category);
  const rnd = mulberry32(hashString(`${seed}|${category}`.toLowerCase()));
  const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const colors = [palette.a, palette.b, palette.c];
  const shapes: CoverShape[] = [];
  const count = 4 + Math.floor(rnd() * 2);

  for (let i = 0; i < count; i++) {
    const big = i === 0;
    const size = big ? 110 + rnd() * 90 : 34 + rnd() * 70;
    const cx = -20 + rnd() * (W + 40);
    const cy = -20 + rnd() * (H + 40);
    const rot = Math.round(rnd() * 360);
    const fill = big ? pick([palette.a, palette.b]) : pick(colors);
    const transform = `rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
    const kind = pick(['circle', 'ring', 'half', 'quarter', 'square', 'pill', 'triangle', 'dots']);

    switch (kind) {
      case 'circle':
        shapes.push({ kind: 'circle', cx, cy, r: size / 2, fill });
        break;
      case 'ring':
        shapes.push({ kind: 'circle', cx, cy, r: size / 2.4, fill: 'none', stroke: fill, strokeWidth: Math.max(8, size * 0.16) });
        break;
      case 'half': {
        const r = size / 2;
        shapes.push({ kind: 'path', d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z`, fill, transform });
        break;
      }
      case 'quarter': {
        const r = size * 0.7;
        shapes.push({ kind: 'path', d: `M${cx} ${cy} L${cx + r} ${cy} A${r} ${r} 0 0 1 ${cx} ${cy + r} Z`, fill, transform });
        break;
      }
      case 'square':
        shapes.push({ kind: 'rect', x: cx - size / 2, y: cy - size / 2, w: size, h: size, rx: size * 0.18, fill, transform });
        break;
      case 'pill':
        shapes.push({ kind: 'rect', x: cx - size, y: cy - size * 0.22, w: size * 2, h: size * 0.44, rx: size * 0.22, fill, transform });
        break;
      case 'triangle': {
        const s = size * 0.7;
        shapes.push({ kind: 'polygon', points: `${cx},${cy - s} ${cx + s},${cy + s * 0.8} ${cx - s},${cy + s * 0.8}`, fill, transform });
        break;
      }
      case 'dots':
        for (let gx = 0; gx < 3; gx++) {
          for (let gy = 0; gy < 3; gy++) {
            shapes.push({ kind: 'circle', cx: cx + gx * 18, cy: cy + gy * 18, r: 4.5, fill });
          }
        }
        break;
    }
  }
  return { palette, shapes };
}

/** Pastille de couleur pour les avatars, stable pour un nom donné. */
export function avatarPalette(name: string | null | undefined): CoverPalette {
  return PALETTES[hashString((name ?? '?').toLowerCase()) % PALETTES.length];
}
