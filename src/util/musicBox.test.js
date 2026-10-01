import { buildScore, LOOP_SECONDS } from './musicBox';

const D_MAJOR = new Set([2, 4, 6, 7, 9, 11, 1]); // pitch classes D E F# G A B C#

describe('buildScore', () => {
  const score = buildScore();

  it('stays in D major', () => {
    const outside = score.filter(n => !D_MAJOR.has(n.midi % 12));
    expect(outside).toEqual([]);
  });

  it('is sorted and fits in one loop', () => {
    score.forEach((n, i) => {
      expect(n.time).toBeGreaterThanOrEqual(0);
      expect(n.time).toBeLessThan(LOOP_SECONDS);
      if (i > 0) {
        expect(n.time).toBeGreaterThanOrEqual(score[i - 1].time);
      }
    });
  });

  it('starts with the bass and the melody together', () => {
    const first = score.filter(n => n.time === 0).map(n => n.midi).sort();
    expect(first).toEqual([50, 78]); // D3 and F#5
  });
});
