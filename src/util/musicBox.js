// A music box playing Pachelbel's Canon in D, synthesized in the browser:
// no audio file to download or license (the composition is public domain,
// the arrangement is ours).

const BEAT = 0.75; // seconds per beat
const CHORD_BEATS = 2;

// Chord per half bar: D A Bm F#m G D G A. Root in the bass register.
const CHORDS = [
  { root: 50, tones: [62, 66, 69] }, // D
  { root: 45, tones: [61, 64, 69] }, // A
  { root: 47, tones: [62, 66, 71] }, // Bm
  { root: 42, tones: [61, 66, 69] }, // F#m
  { root: 43, tones: [62, 67, 71] }, // G
  { root: 50, tones: [62, 66, 69] }, // D
  { root: 43, tones: [62, 67, 71] }, // G
  { root: 45, tones: [61, 64, 69] }, // A
];

// Three passes over the progression, each with its own melody.
const MELODIES = [
  // The descending line everyone knows: one note per chord
  [[78, 2]], [[76, 2]], [[74, 2]], [[73, 2]], [[71, 2]], [[69, 2]], [[71, 2]], [[73, 2]],
  // Two notes per chord, walking down in thirds
  [[78, 1], [74, 1]], [[76, 1], [73, 1]], [[74, 1], [71, 1]], [[73, 1], [69, 1]],
  [[71, 1], [67, 1]], [[69, 1], [66, 1]], [[71, 1], [67, 1]], [[73, 1], [69, 1]],
  // Eighth notes climbing through each chord
  [[74, 0.5], [78, 0.5], [81, 0.5], [78, 0.5]], [[73, 0.5], [76, 0.5], [81, 0.5], [76, 0.5]],
  [[74, 0.5], [78, 0.5], [83, 0.5], [78, 0.5]], [[73, 0.5], [78, 0.5], [81, 0.5], [78, 0.5]],
  [[74, 0.5], [79, 0.5], [83, 0.5], [79, 0.5]], [[74, 0.5], [78, 0.5], [81, 0.5], [86, 0.5]],
  [[83, 0.5], [79, 0.5], [74, 0.5], [79, 0.5]], [[81, 0.5], [76, 0.5], [73, 0.5], [76, 0.5]],
];

/**
 * The notes of one loop: { time (s), midi, velocity, length (s) }.
 * Exported for tests.
 */
export function buildScore() {
  const notes = [];
  const passes = MELODIES.length / CHORDS.length;
  for (let pass = 0; pass < passes; pass++) {
    CHORDS.forEach((chord, i) => {
      const start = (pass * CHORDS.length + i) * CHORD_BEATS * BEAT;
      // Bass, then a soft broken chord under the melody
      notes.push({ time: start, midi: chord.root, velocity: 0.55, length: 2.6 });
      chord.tones.forEach((midi, k) => {
        notes.push({ time: start + (k + 1) * (BEAT / 2), midi, velocity: 0.22, length: 1.6 });
      });
      let t = start;
      for (const [midi, beats] of MELODIES[pass * CHORDS.length + i]) {
        notes.push({ time: t, midi, velocity: 0.5, length: 1.9 });
        t += beats * BEAT;
      }
    });
  }
  return notes.sort((a, b) => a.time - b.time);
}

export const LOOP_SECONDS = (MELODIES.length * CHORD_BEATS * BEAT);

const LOOKAHEAD = 1.2; // seconds of notes scheduled ahead
const TICK_MS = 300;

function frequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** A short hall made of decaying noise, for a little air around the notes. */
function makeReverb(ctx) {
  const seconds = 2.4;
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

/**
 * Plays the music box. Create it from a tap or click handler: browsers only
 * let audio start from a user gesture.
 */
export class MusicBox {
  constructor() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.score = buildScore();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    const dry = this.ctx.createGain();
    dry.gain.value = 0.8;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.35;
    const reverb = makeReverb(this.ctx);
    this.master.connect(dry).connect(this.ctx.destination);
    this.master.connect(reverb).connect(wet).connect(this.ctx.destination);
    this.loopStart = 0;
    this.next = 0;
    this.timer = null;
    this.playing = false;
  }

  /** One tine: a bright pluck that rings and fades. */
  pluck(note, when) {
    const { ctx } = this;
    const f = frequency(note.midi);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(note.velocity, when + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, when + note.length);
    out.connect(this.master);
    // Fundamental, octave and the metallic partial of a steel tine
    [[1, 1], [2, 0.28], [5.4, 0.06]].forEach(([ratio, level]) => {
      if (f * ratio > 18000) {
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.value = level;
      // Upper partials die out sooner than the fundamental
      if (ratio > 1) {
        g.gain.setValueAtTime(level, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + note.length / (ratio * 1.5));
      }
      osc.connect(g).connect(out);
      osc.start(when);
      osc.stop(when + note.length + 0.05);
    });
  }

  schedule() {
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    while (true) {
      if (this.next >= this.score.length) {
        this.next = 0;
        this.loopStart += LOOP_SECONDS;
      }
      const note = this.score[this.next];
      const when = this.loopStart + note.time;
      if (when > horizon) {
        break;
      }
      if (when >= this.ctx.currentTime) {
        this.pluck(note, when);
      }
      this.next++;
    }
  }

  async play() {
    if (this.playing) {
      return;
    }
    this.playing = true;
    await this.ctx.resume();
    if (this.timer === null) {
      this.loopStart = this.ctx.currentTime + 0.15;
      this.next = 0;
      this.timer = setInterval(() => this.schedule(), TICK_MS);
      this.schedule();
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.32, now + 1.5);
  }

  /** Fades out, then suspends the audio clock so the song resumes in place. */
  async pause() {
    if (!this.playing) {
      return;
    }
    this.playing = false;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.4);
    await new Promise(resolve => setTimeout(resolve, 450));
    if (!this.playing) {
      await this.ctx.suspend();
    }
  }

  close() {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.ctx.close().catch(() => { });
  }
}

export function canPlayMusic() {
  return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
}
