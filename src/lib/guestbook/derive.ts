import type { FallStyle, GuestNote, NoteDerived } from './types';
import { cyrb53, seededRandoms } from './hash';

export const WRINKLE_FILTER_COUNT = 8;

function hashInput(note: GuestNote): string {
  return `${note.userId}::${note.createdAt}::${note.content}`;
}

function computeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatNoteBg(
  hue: number,
  variance: number,
  theme: 'light' | 'dark'
): string {
  if (theme === 'dark') {
    const sat = 18 + variance * 6;
    const light = 19 + variance * 5;
    return `hsl(${hue}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
  }
  const sat = 14 + variance * 6;
  const light = 92 + variance * 3;
  return `hsl(${hue}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
}

export function formatNoteBand(hue: number, theme: 'light' | 'dark'): string {
  if (theme === 'dark') {
    return `hsl(${hue}, 32%, 42%)`;
  }
  return `hsl(${hue}, 32%, 78%)`;
}

export function deriveNote(note: GuestNote): NoteDerived {
  const hash = cyrb53(hashInput(note));
  const r = seededRandoms(hash, 12);

  const hue = Math.floor(r[0] * 360);
  const colorVariance = r[9];
  const xRatio = 0.06 + r[1] * 0.82;
  const yRatio = 0.08 + r[2] * 0.78;
  const baseTilt = (r[3] - 0.5) * 10;
  const lifespanFactor = 0.6 + r[4] * 0.8;
  const wrinkleFilterIndex = Math.floor(r[5] * WRINKLE_FILTER_COUNT) % WRINKLE_FILTER_COUNT;
  const dx = (r[6] - 0.5) * 260;
  const dy = 380 + r[7] * 240;
  const dRot = (r[8] - 0.5) * 80;
  const fallStyle = (Math.floor(r[10] * 4) % 4) as FallStyle;

  return {
    hash,
    hue,
    colorVariance,
    position: { xRatio, yRatio },
    baseTilt,
    lifespanFactor,
    wrinkleFilterIndex,
    fall: { dx, dy, dRot },
    initials: computeInitials(note.userName || note.userId),
    fallStyle,
  };
}
