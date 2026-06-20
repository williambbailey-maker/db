export interface Settings {
  /** Sound level (dB) at or above which the meter turns red. */
  threshold: number;
  /** Offset added to the raw dBFS reading to approximate dB SPL. */
  calibration: number;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  /** Average level across the session. */
  avg: number;
  min: number;
  /** Peak level reached. */
  max: number;
  /** The threshold that was active during this session. */
  threshold: number;
  /** Approximate time spent at or above the threshold. */
  exceededMs: number;
}
