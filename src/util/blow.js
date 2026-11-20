// "Blow out the candles" into the phone's microphone: a blow is a loud,
// steady rush of air, so we wait for the level to stay well above the
// room's for a moment. The gate is plain logic (tested); listenForBlows
// wires it to the microphone.

/**
 * @param {{ holdMs?: number, cooldownMs?: number, calibrateMs?: number, floor?: number, ceiling?: number }} [opts]
 * @returns {(level: number, now: number) => boolean} true once per blow
 */
export function createBlowGate({ holdMs = 120, cooldownMs = 450, calibrateMs = 400, floor = 0.06, ceiling = 0.18 } = {}) {
  let startedAt = null;
  let ambient = Infinity;
  let loudSince = null;
  let quietUntil = 0;
  return (level, now) => {
    if (startedAt === null) {
      startedAt = now;
    }
    // First listen to the room: its quietest moment, so blowing right
    // away does not raise the bar
    if (now - startedAt < calibrateMs) {
      ambient = Math.min(ambient, level);
      return false;
    }
    // Three times the room, but never so high a real blow cannot reach it
    const threshold = Math.min(ceiling, Math.max(floor, (Number.isFinite(ambient) ? ambient : 0) * 3));
    if (now < quietUntil || level < threshold) {
      loudSince = level < threshold ? null : loudSince;
      return false;
    }
    if (loudSince === null) {
      loudSince = now;
    }
    if (now - loudSince >= holdMs) {
      loudSince = null;
      quietUntil = now + cooldownMs;
      return true;
    }
    return false;
  };
}

/** Root mean square of a waveform (values -1..1). */
export function levelOf(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / (samples.length || 1));
}

export const canListen = () => Boolean(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia
  && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));

/**
 * Starts listening; call from a tap (the audio context must start in one).
 * Resolves to a stop function; rejects when the microphone is refused.
 */
export async function listenForBlows(onBlow) {
  const Context = window.AudioContext || window.webkitAudioContext;
  const ctx = new Context();
  ctx.resume?.();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (err) {
    ctx.close?.();
    throw err;
  }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buffer = new Float32Array(analyser.fftSize);
  const gate = createBlowGate();
  let frame = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) {
      return;
    }
    analyser.getFloatTimeDomainData(buffer);
    if (gate(levelOf(buffer), performance.now())) {
      onBlow();
    }
    frame = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    stream.getTracks().forEach(track => track.stop());
    source.disconnect();
    ctx.close?.();
  };
}
