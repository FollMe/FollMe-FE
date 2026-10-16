import {
  DEFAULT_CHOICE, NICE_AMOUNTS, choiceFromQuery, choiceToQuery, giftAdvice, niceAbove, niceBelow, niceNearest,
} from './giftAdvice';

describe('nice amounts', () => {
  it('snaps to what people put in an envelope, never a 4', () => {
    expect(NICE_AMOUNTS.some(a => String(a).includes('4'))).toBe(false);
    expect(niceBelow(450_000)).toBe(300_000);
    expect(niceAbove(450_000)).toBe(500_000);
    expect(niceNearest(950_000)).toBe(1_000_000);
    expect(niceBelow(50_000)).toBe(100_000);
    expect(niceAbove(99_000_000)).toBe(20_000_000);
  });
});

describe('giftAdvice', () => {
  it('suggests about one place for a friend going alone to a city restaurant', () => {
    // 550k–850k a place, ×1–1.4
    expect(giftAdvice(DEFAULT_CHOICE)).toMatchObject({ low: 500_000, high: 1_200_000, pick: 800_000 });
  });

  it('gives more for family, two people and a hotel', () => {
    const a = giftAdvice({ ...DEFAULT_CHOICE, relation: 'family', people: 2, venue: 'hotel' });
    expect(a.low).toBe(2_500_000);
    expect(a.high).toBe(10_000_000);
    expect(a.pick).toBeGreaterThanOrEqual(a.low);
    expect(a.pick).toBeLessThanOrEqual(a.high);
  });

  it('gives less when not going, and at a home party in the countryside', () => {
    const away = giftAdvice({ ...DEFAULT_CHOICE, attend: false });
    expect(away.high).toBeLessThan(giftAdvice(DEFAULT_CHOICE).high);
    expect(giftAdvice({ relation: 'acquaintance', people: 1, venue: 'home', region: 'rural', attend: true }))
      .toMatchObject({ low: 100_000, high: 500_000 });
  });

  it('always has a low below its high', () => {
    for (const relation of ['family', 'close', 'friend', 'colleague', 'acquaintance']) {
      for (const venue of ['hotel', 'restaurant', 'home']) {
        for (const attend of [true, false]) {
          const a = giftAdvice({ relation, venue, region: 'rural', people: 1, attend });
          expect(a.low).toBeLessThan(a.high);
        }
      }
    }
  });
});

describe('links', () => {
  it('round-trips the choice and ignores junk', () => {
    const choice = { relation: 'close', people: 2, venue: 'hotel', region: 'city', attend: false };
    expect(choiceFromQuery(new URLSearchParams(choiceToQuery(choice)))).toEqual(choice);
    expect(choiceFromQuery(new URLSearchParams('qh=boss&ng=9&noi=x&kv=moon'))).toEqual(DEFAULT_CHOICE);
  });
});
