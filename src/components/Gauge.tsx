import { DISPLAY_MAX, DISPLAY_MIN, clamp01, levelColor } from '../lib/levels';

interface GaugeProps {
  db: number;
  threshold: number;
  active: boolean;
}

const SIZE = 280;
const STROKE = 20;

export default function Gauge({ db, threshold, active }: GaugeProps) {
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = clamp01((db - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN));
  const color = active ? levelColor(db, threshold) : '#3a3a40';
  const shown = active ? Math.round(db) : 0;
  const tooLoud = active && db >= threshold;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke="#1c1c22"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{
            transition: 'stroke-dashoffset 0.12s linear, stroke 0.2s ease',
            filter: active ? `drop-shadow(0 0 12px ${color}66)` : 'none',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-7xl font-semibold tabular-nums tracking-tight transition-colors"
          style={{ color: active ? '#ffffff' : '#48484e' }}
        >
          {shown}
        </div>
        <div className="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/40">
          dB
        </div>
        {tooLoud && (
          <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#ff453a]">
            Too loud
          </div>
        )}
      </div>
    </div>
  );
}
