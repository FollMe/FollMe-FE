import { createBlowGate, levelOf } from './blow';

function run(gate, levels, stepMs = 20) {
  const hits = [];
  levels.forEach((level, i) => gate(level, i * stepMs) && hits.push(i * stepMs));
  return hits;
}

describe('blow', () => {
  it('measures a waveform', () => {
    expect(levelOf([0, 0, 0])).toBe(0);
    expect(levelOf([0.5, -0.5])).toBeCloseTo(0.5);
  });

  it('hears a steady blow once, then waits before the next', () => {
    const gate = createBlowGate({ holdMs: 120, cooldownMs: 400, calibrateMs: 200 });
    // 200ms of room, then a 1s blow
    const hits = run(gate, [...Array(10).fill(0.01), ...Array(50).fill(0.3)]);
    expect(hits[0]).toBe(320);
    // One every hold + cooldown while it keeps blowing
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits[1] - hits[0]).toBeGreaterThanOrEqual(400);
  });

  it('ignores a short click and a noisy room', () => {
    const quiet = createBlowGate({ calibrateMs: 200 });
    expect(run(quiet, [...Array(10).fill(0.01), 0.5, 0.5, 0.01, 0.01, 0.01])).toEqual([]);
    // In a noisy room the bar is three times the room...
    expect(run(createBlowGate({ calibrateMs: 200 }), [...Array(10).fill(0.04), ...Array(20).fill(0.1)])).toEqual([]);
    expect(run(createBlowGate({ calibrateMs: 200 }), [...Array(10).fill(0.04), ...Array(20).fill(0.3)]).length).toBe(1);
  });

  it('still hears her when she blows before it has listened to the room', () => {
    // Blowing from the first moment: the quietest sample sets the bar, capped
    const gate = createBlowGate({ calibrateMs: 200 });
    expect(run(gate, [0.01, ...Array(40).fill(0.25)]).length).toBeGreaterThanOrEqual(1);
    expect(run(createBlowGate({ calibrateMs: 200 }), Array(40).fill(0.25)).length).toBeGreaterThanOrEqual(1);
  });
});
