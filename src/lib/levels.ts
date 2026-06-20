/** The visible range of the gauge, in dB. */
export const DISPLAY_MIN = 30;
export const DISPLAY_MAX = 120;

/** How many dB below the threshold the meter starts warning (amber). */
const WARN_BAND = 8;

/**
 * Colour for a reading: green when comfortably below the threshold, amber as it
 * approaches, red once the threshold is reached or exceeded.
 */
export function levelColor(db: number, threshold: number): string {
  if (db >= threshold) return '#ff453a';
  if (db >= threshold - WARN_BAND) return '#ffd60a';
  return '#30d158';
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Format milliseconds as m:ss. */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
