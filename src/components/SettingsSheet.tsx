import type { Settings } from '../lib/types';

interface SettingsSheetProps {
  settings: Settings;
  sessionCount: number;
  onChange: (next: Settings) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-white/70">{label}</span>
        <span className="text-base font-semibold tabular-nums">
          {value}
          <span className="text-white/40 text-sm"> {unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#30d158]"
      />
    </div>
  );
}

export default function SettingsSheet({
  settings,
  sessionCount,
  onChange,
  onClearHistory,
  onClose,
}: SettingsSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        className="relative bg-[#15151b] rounded-t-3xl border-t border-white/10 px-6 pt-3 pb-8 max-w-md w-full mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/15" />
        <h2 className="text-lg font-bold mb-6">Settings</h2>

        <div className="space-y-7">
          <Slider
            label="Red above"
            value={settings.threshold}
            min={50}
            max={110}
            unit="dB"
            onChange={(threshold) => onChange({ ...settings, threshold })}
          />

          <div>
            <Slider
              label="Calibration"
              value={settings.calibration}
              min={70}
              max={130}
              unit="offset"
              onChange={(calibration) => onChange({ ...settings, calibration })}
            />
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Phone mics aren&apos;t calibrated instruments. Nudge this until the
              reading matches a known reference (or a real sound-level meter) in
              a steady sound. Readings are an approximation.
            </p>
          </div>

          <button
            onClick={onClearHistory}
            disabled={sessionCount === 0}
            className="w-full py-3 rounded-2xl bg-white/5 text-[#ff453a] font-medium disabled:opacity-30 active:scale-[0.99] transition"
          >
            Clear history{sessionCount > 0 ? ` (${sessionCount})` : ''}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-7 w-full py-3.5 rounded-2xl bg-white/10 font-semibold active:scale-[0.99] transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
