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

type RGB = [number, number, number];

/** Background colour ramp: green → yellow → orange → red. */
const BG_STOPS: Array<[number, RGB]> = [
  [0, [34, 160, 75]], // green
  [0.5, [240, 190, 20]], // yellow
  [0.78, [240, 140, 20]], // orange
  [1, [228, 48, 42]], // red
];

/** How many dB below the threshold the ramp starts leaving green. */
const RAMP_RANGE = 25;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixStops(t: number): RGB {
  const x = clamp01(t);
  for (let i = 1; i < BG_STOPS.length; i++) {
    const [t0, c0] = BG_STOPS[i - 1];
    const [t1, c1] = BG_STOPS[i];
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return BG_STOPS[BG_STOPS.length - 1][1];
}

/**
 * A sleek vertical gradient for the app background. Sits green when idle or
 * quiet and ramps through yellow/orange to red as the level nears and passes
 * the threshold.
 */
export function backgroundForLevel(
  db: number,
  threshold: number,
  active: boolean,
): string {
  const t = active ? (db - (threshold - RAMP_RANGE)) / RAMP_RANGE : 0;
  const [r, g, b] = mixStops(t).map(Math.round);
  const dark = (c: number) => Math.round(c * 0.78);
  return `linear-gradient(160deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${dark(r)}, ${dark(g)}, ${dark(b)}) 100%)`;
}

