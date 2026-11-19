import { buildScore, LOOP_SECONDS, birthdayScore, BIRTHDAY_LOOP_SECONDS } from './musicBox';

const D_MAJOR = new Set([2, 4, 6, 7, 9, 11, 1]); // pitch classes D E F# G A B C#

describe('buildScore', () => {
  const score = buildScore();

  it('stays in D major', () => {
    const outside = score.filter(n => !D_MAJOR.has(n.midi % 12));
    expect(outside).toEqual([]);
  });

  it('is sorted and fits in one loop', () => {
    const times = score.map(n => n.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(Math.min(...times)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...times)).toBeLessThan(LOOP_SECONDS);
  });

  it('starts with the bass and the melody together', () => {
    const first = score.filter(n => n.time === 0).map(n => n.midi).sort();
    expect(first).toEqual([50, 78]); // D3 and F#5
  });
});

describe('birthdayScore', () => {
  const score = birthdayScore();

  it('plays the 25 notes of the tune, a chord per bar, within the loop', () => {
    const melody = score.filter(n => n.velocity === 0.55);
    expect(melody).toHaveLength(25);
    // "Hap-py birth-day to you": G G A G C B
    expect(melody.slice(0, 6).map(n => n.midi)).toEqual([67, 67, 69, 67, 72, 71]);
    expect(score.filter(n => n.velocity === 0.45)).toHaveLength(8);
    expect(Math.max(...score.map(n => n.time))).toBeLessThan(BIRTHDAY_LOOP_SECONDS);
    expect(score.every((n, i) => i === 0 || n.time >= score[i - 1].time)).toBe(true);
  });
});
