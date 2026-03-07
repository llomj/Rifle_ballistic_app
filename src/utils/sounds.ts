/**
 * Web Audio API sound effects for quiz feedback.
 * Correct/incorrect sounds and star celebration melodies.
 * Uses a shared AudioContext (reused) - browsers require user gesture to unlock.
 */

let sharedContext: AudioContext | null = null;
let unlockAttached = false;

/** Unlock AudioContext on first user interaction (required by iOS/Safari) */
const unlockAudio = () => {
  if (sharedContext && sharedContext.state === 'suspended') sharedContext.resume();
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (sharedContext) return sharedContext;
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  sharedContext = new AC();
  if (!unlockAttached) {
    unlockAttached = true;
    ['click', 'touchstart', 'keydown'].forEach((ev) => {
      document.addEventListener(ev, unlockAudio, { once: false, passive: true });
    });
  }
  return sharedContext;
};

// Create context and attach unlock listeners when module loads (browser only)
if (typeof window !== 'undefined') {
  getAudioContext();
}

const scheduleTone = (
  audioContext: AudioContext,
  masterGain: GainNode,
  now: number,
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) => {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = now + startOffset;
  const end = start + duration;
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(end + 0.01);
};

/** Play happy chime when answer is correct */
export const playCorrectSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  scheduleTone(ctx, masterGain, now, 523.25, 0, 0.12, 'sine', 0.5); // C5
  scheduleTone(ctx, masterGain, now, 659.25, 0.1, 0.15, 'sine', 0.4); // E5
  scheduleTone(ctx, masterGain, now, 783.99, 0.2, 0.2, 'sine', 0.35);  // G5
};

/** Play gentle "wrong" sound when answer is incorrect */
export const playIncorrectSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  scheduleTone(ctx, masterGain, now, 200, 0, 0.1, 'sawtooth', 0.2);
  scheduleTone(ctx, masterGain, now, 180, 0.08, 0.12, 'sawtooth', 0.15);
};

/** Short Mario/Alex Kid style melody for 1–4 stars */
export const playStarMelodyShort = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

  const notes = [
    { freq: 587.33, at: 0.0, len: 0.07 },
    { freq: 739.99, at: 0.08, len: 0.07 },
    { freq: 880.0, at: 0.16, len: 0.08 },
    { freq: 1108.73, at: 0.25, len: 0.1 },
    { freq: 1318.51, at: 0.37, len: 0.24 },
  ];

  notes.forEach((n) => {
    scheduleTone(ctx, masterGain, now, n.freq, n.at, n.len, 'square', 0.2);
    scheduleTone(ctx, masterGain, now, n.freq * 0.5, n.at, n.len, 'triangle', 0.1);
  });

  scheduleTone(ctx, masterGain, now, 146.83, 0.0, 0.18, 'sawtooth', 0.08);
  scheduleTone(ctx, masterGain, now, 185.0, 0.18, 0.18, 'sawtooth', 0.08);
  scheduleTone(ctx, masterGain, now, 220.0, 0.36, 0.24, 'sawtooth', 0.08);
};

/** Longer game melody for 5 stars (victory fanfare) */
export const playStarMelodyLong = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

  const notes = [
    { freq: 523.25, at: 0.0, len: 0.15 },
    { freq: 659.25, at: 0.12, len: 0.15 },
    { freq: 783.99, at: 0.24, len: 0.15 },
    { freq: 1046.5, at: 0.36, len: 0.35 },
    { freq: 1046.5, at: 0.8, len: 0.2 },
    { freq: 1174.66, at: 0.95, len: 0.2 },
    { freq: 1318.51, at: 1.1, len: 0.25 },
    { freq: 1567.98, at: 1.25, len: 0.5 },
  ];

  notes.forEach((n) => {
    scheduleTone(ctx, masterGain, now, n.freq, n.at, n.len, 'square', 0.15);
    scheduleTone(ctx, masterGain, now, n.freq * 0.5, n.at, n.len, 'triangle', 0.08);
  });
};

export const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
