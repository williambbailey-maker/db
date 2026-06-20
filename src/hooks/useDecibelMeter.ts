import { useCallback, useEffect, useRef, useState } from 'react';

export type MeterStatus = 'idle' | 'requesting' | 'running' | 'denied' | 'error';

/**
 * Streams a smoothed sound level from the device microphone.
 *
 * Note: browsers expose level relative to digital full scale (dBFS), not true
 * sound-pressure level. We add a calibration offset to land in a familiar dB
 * SPL range — it's an approximation, not a lab-grade measurement.
 */
export function useDecibelMeter(calibration: number) {
  const [status, setStatus] = useState<MeterStatus>('idle');
  const [db, setDb] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothRef = useRef(0);
  const lastEmitRef = useRef(0);
  const calibrationRef = useRef(calibration);
  const sampleCbRef = useRef<((db: number) => void) | null>(null);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getFloatTimeDomainData(data);
    let sumSq = 0;
    for (let i = 0; i < data.length; i++) {
      sumSq += data[i] * data[i];
    }
    const rms = Math.sqrt(sumSq / data.length);
    const dbfs = 20 * Math.log10(rms || 1e-7); // negative; 0 = full scale
    let value = dbfs + calibrationRef.current;
    if (!isFinite(value)) value = 0;
    value = Math.max(0, value);

    // Exponential smoothing so the readout doesn't jitter.
    const prev = smoothRef.current || value;
    const smooth = prev + (value - prev) * 0.25;
    smoothRef.current = smooth;

    // Feed every frame to the session collector for an accurate average.
    sampleCbRef.current?.(smooth);

    // Throttle React state updates to keep the UI light.
    const now = performance.now();
    if (now - lastEmitRef.current > 80) {
      lastEmitRef.current = now;
      setDb(smooth);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);

      analyserRef.current = analyser;
      dataRef.current = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      smoothRef.current = 0;

      setStatus('running');
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e) {
      const err = e as DOMException;
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setStatus('denied');
      } else {
        setStatus('error');
        setError(err?.message ?? 'Could not access the microphone.');
      }
      return false;
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    smoothRef.current = 0;
    setDb(0);
    setStatus('idle');
  }, []);

  // Clean up if the component unmounts mid-session.
  useEffect(() => () => stop(), [stop]);

  const setSampleCb = useCallback((cb: ((db: number) => void) | null) => {
    sampleCbRef.current = cb;
  }, []);

  return { status, db, error, start, stop, setSampleCb };
}
