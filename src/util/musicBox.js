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

// "Happy Birthday to You" (public domain): 3/4, in C, a one-beat pickup
const BIRTHDAY_BEAT = 0.5;
const BIRTHDAY_MELODY = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 3],
];
// One chord per bar after the pickup: C G G C C F C C
const BIRTHDAY_BARS = [
  { root: 48, tones: [60, 64, 67] }, { root: 43, tones: [59, 62, 67] }, { root: 43, tones: [59, 62, 65] },
  { root: 48, tones: [60, 64, 67] }, { root: 48, tones: [60, 64, 67] }, { root: 41, tones: [60, 65, 69] },
  { root: 43, tones: [60, 64, 67] }, { root: 48, tones: [60, 64, 67] },
];
// The song and two beats of rest before it starts again
export const BIRTHDAY_LOOP_SECONDS = (1 + BIRTHDAY_BARS.length * 3 + 2) * BIRTHDAY_BEAT;

/** The notes of "Happy Birthday", like buildScore. */
export function birthdayScore() {
  const notes = [];
  let t = 0;
  for (const [midi, beats] of BIRTHDAY_MELODY) {
    notes.push({ time: t * BIRTHDAY_BEAT, midi, velocity: 0.55, length: 1.6 });
    t += beats;
  }
  BIRTHDAY_BARS.forEach((bar, i) => {
    const start = (1 + i * 3) * BIRTHDAY_BEAT;
    notes.push({ time: start, midi: bar.root, velocity: 0.45, length: 2.2 });
    bar.tones.forEach((midi, k) => {
      notes.push({ time: start + (k + 1) * BIRTHDAY_BEAT * 0.75, midi, velocity: 0.18, length: 1.2 });
    });
  });
  return notes.sort((a, b) => a.time - b.time);
}

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
  /** `song`: 'canon' (the wedding default) or 'birthday'. */
  constructor({ song = 'canon' } = {}) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.score = song === 'birthday' ? birthdayScore() : buildScore();
    this.loopSeconds = song === 'birthday' ? BIRTHDAY_LOOP_SECONDS : LOOP_SECONDS;
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
        this.loopStart += this.loopSeconds;
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
