import { useCallback, useEffect, useRef, useState } from 'react';
import Gauge from './components/Gauge';
import SettingsSheet from './components/SettingsSheet';
import { TrashIcon, GearIcon } from './components/icons';
import { useDecibelMeter } from './hooks/useDecibelMeter';
import {
  loadSessions,
  loadSettings,
  saveSessions,
  saveSettings,
} from './lib/storage';
import { backgroundForLevel, formatDuration } from './lib/levels';
import type { Session, Settings } from './lib/types';

type View = 'meter' | 'history';

interface LiveStats {
  avg: number;
  max: number;
  elapsed: number;
}

const EMPTY_STATS: LiveStats = { avg: 0, max: 0, elapsed: 0 };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [view, setView] = useState<View>('meter');
  const [showSettings, setShowSettings] = useState(false);
  const [recording, setRecording] = useState(false);
  const [live, setLive] = useState<LiveStats>(EMPTY_STATS);
  const [lastSaved, setLastSaved] = useState<Session | null>(null);

  const { status, db, error, start, stop, setSampleCb } = useDecibelMeter(
    settings.calibration,
  );

  // Mirrors so the per-frame sample callback reads current values without
  // re-subscribing on every render.
  const recordingRef = useRef(false);
  const settingsRef = useRef(settings);
  const acc = useRef({
    sum: 0,
    count: 0,
    min: Infinity,
    max: 0,
    exceeded: 0,
    start: 0,
  });

  useEffect(() => {
    settingsRef.current = settings;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  // Accumulate every sample while a session is recording.
  useEffect(() => {
    setSampleCb((value: number) => {
      if (!recordingRef.current) return;
      const a = acc.current;
      a.sum += value;
      a.count += 1;
      if (value < a.min) a.min = value;
      if (value > a.max) a.max = value;
      if (value >= settingsRef.current.threshold) a.exceeded += 1;
    });
    return () => setSampleCb(null);
  }, [setSampleCb]);

  // Update the live readout (avg / peak / timer) a few times a second.
  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      const a = acc.current;
      setLive({
        avg: a.count ? a.sum / a.count : 0,
        max: a.max,
        elapsed: Date.now() - a.start,
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [recording]);

  const startSession = useCallback(async () => {
    setLastSaved(null);
    acc.current = {
      sum: 0,
      count: 0,
      min: Infinity,
      max: 0,
      exceeded: 0,
      start: Date.now(),
    };
    setLive(EMPTY_STATS);
    const ok = await start();
    if (ok) setRecording(true);
  }, [start]);

  const endSession = useCallback(() => {
    setRecording(false);
    stop();
    const a = acc.current;
    if (a.count === 0) return;

    const endedAt = Date.now();
    const durationMs = endedAt - a.start;
    const session: Session = {
      id: crypto.randomUUID?.() ?? String(endedAt),
      startedAt: a.start,
      endedAt,
      durationMs,
      avg: a.sum / a.count,
      min: a.min === Infinity ? 0 : a.min,
      max: a.max,
      threshold: settingsRef.current.threshold,
      exceededMs: (a.exceeded / a.count) * durationMs,
    };

    setSessions((prev) => {
      const next = [session, ...prev].slice(0, 100);
      saveSessions(next);
      return next;
    });
    setLastSaved(session);
  }, [stop]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSessions(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    saveSessions([]);
    setShowSettings(false);
  }, []);

  const background = backgroundForLevel(db, settings.threshold, recording);

  return (
    <div
      className="min-h-full flex flex-col max-w-md mx-auto px-5"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
      }}
    >
      <div
        className="fixed inset-0 -z-10"
        style={{ background, transition: 'background 0.15s linear' }}
      />
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">dB</h1>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 active:scale-95 transition"
        >
          <GearIcon />
        </button>
      </header>

      <div className="flex bg-white/5 rounded-full p-1 mb-6 text-sm font-medium">
        {(['meter', 'history'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-full capitalize transition ${
              view === v ? 'bg-white/15 text-white' : 'text-white/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'meter' ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Gauge db={db} threshold={settings.threshold} active={recording} />

            <p className="text-sm text-white/80">
              Turns red above{' '}
              <span className="font-semibold text-white">
                {settings.threshold} dB
              </span>
            </p>

            {recording && (
              <div className="flex w-full max-w-xs">
                <Stat label="Average" value={`${Math.round(live.avg)}`} />
                <Stat label="Peak" value={`${Math.round(live.max)}`} />
                <Stat label="Time" value={formatDuration(live.elapsed)} />
              </div>
            )}

            {lastSaved && !recording && (
              <div className="w-full bg-white/5 rounded-2xl px-5 py-4">
                <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
                  Session saved
                </div>
                <div className="flex">
                  <Stat label="Average" value={`${Math.round(lastSaved.avg)}`} />
                  <Stat label="Peak" value={`${Math.round(lastSaved.max)}`} />
                  <Stat
                    label="Length"
                    value={formatDuration(lastSaved.durationMs)}
                  />
                </div>
              </div>
            )}

            {status === 'denied' && (
              <p className="text-sm text-center text-[#ff453a]/90 max-w-xs">
                Microphone access was blocked. Allow it in your browser settings,
                then try again.
              </p>
            )}
            {status === 'error' && error && (
              <p className="text-sm text-center text-[#ff453a]/90 max-w-xs">
                {error}
              </p>
            )}
          </div>

          <button
            onClick={recording ? endSession : startSession}
            disabled={status === 'requesting'}
            className="mt-6 w-full py-4 rounded-2xl font-semibold text-lg active:scale-[0.99] transition disabled:opacity-60"
            style={{
              background: '#ffffff',
              color: recording ? '#c4271d' : '#0b6b34',
            }}
          >
            {status === 'requesting'
              ? 'Starting…'
              : recording
                ? 'End session'
                : 'Start session'}
          </button>
        </div>
      ) : (
        <div className="flex-1">
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/40 gap-2 pt-20">
              <p className="text-base">No sessions yet</p>
              <p className="text-sm">
                Start a session on the meter tab to track averages over time.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tabular-nums">
                        {Math.round(s.avg)}
                      </span>
                      <span className="text-sm text-white/40">avg dB</span>
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {new Date(s.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · {formatDuration(s.durationMs)} · peak {Math.round(s.max)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(s.id)}
                    aria-label="Delete session"
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-95 transition"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showSettings && (
        <SettingsSheet
          settings={settings}
          sessionCount={sessions.length}
          onChange={setSettings}
          onClearHistory={clearHistory}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
