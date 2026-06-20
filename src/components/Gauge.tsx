import { DISPLAY_MAX, DISPLAY_MIN, clamp01 } from '../lib/levels';

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
  const shown = active ? Math.round(db) : 0;
  const tooLoud = active && db >= threshold;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          stroke="#ffffff"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (active ? progress : 0))}
          style={{
            transition: 'stroke-dashoffset 0.12s linear',
            filter: active ? 'drop-shadow(0 0 10px rgba(255,255,255,0.45))' : 'none',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-7xl font-semibold tabular-nums tracking-tight"
          style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.6)' }}
        >
          {shown}
        </div>
        <div className="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/70">
          dB
        </div>
        {tooLoud && (
          <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-white">
            Too loud
          </div>
        )}
      </div>
    </div>
  );
}
