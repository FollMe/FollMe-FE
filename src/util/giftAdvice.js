// "Đi đám cưới mừng bao nhiêu?": a suggested range for a wedding gift in
// VND, from what one place at the party costs and how close the guest is.
// The prices are rough 2026 estimates for guidance, not quotes.

export const RELATIONS = [
  { value: 'family', label: 'Người thân trong họ', mult: [1.5, 3] },
  { value: 'close', label: 'Bạn thân', mult: [1.3, 2] },
  { value: 'friend', label: 'Bạn bè, bạn học', mult: [1, 1.4] },
  { value: 'colleague', label: 'Đồng nghiệp', mult: [1, 1.3] },
  { value: 'acquaintance', label: 'Người quen, hàng xóm', mult: [0.8, 1.1] },
];

export const VENUES = [
  { value: 'hotel', label: 'Khách sạn, trung tâm tiệc lớn' },
  { value: 'restaurant', label: 'Nhà hàng tiệc cưới' },
  { value: 'home', label: 'Tiệc ở nhà, rạp dựng' },
];

export const REGIONS = [
  { value: 'big', label: 'Hà Nội, TP.HCM' },
  { value: 'city', label: 'Thành phố, thị xã khác' },
  { value: 'rural', label: 'Huyện, nông thôn' },
];

export const PEOPLE = [
  { value: 1, label: 'Một mình' },
  { value: 2, label: 'Hai người' },
  { value: 3, label: 'Cả nhà (3–4 người)' },
];

// One place at the party (a table of 10 / 10), VND: [low, high]
const PLATE = {
  hotel: { big: [900_000, 1_400_000], city: [700_000, 1_000_000], rural: [500_000, 800_000] },
  restaurant: { big: [550_000, 850_000], city: [400_000, 650_000], rural: [300_000, 500_000] },
  home: { big: [300_000, 450_000], city: [250_000, 400_000], rural: [150_000, 300_000] },
};

// What people put in an envelope; amounts with a 4 are left out (many avoid them)
export const NICE_AMOUNTS = [
  100_000, 200_000, 300_000, 500_000, 600_000, 700_000, 800_000, 1_000_000, 1_200_000, 1_500_000, 2_000_000,
  2_500_000, 3_000_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000,
];

export const DEFAULT_CHOICE = { relation: 'friend', people: 1, venue: 'restaurant', region: 'big', attend: true };

/** The nice amount nearest `value` from below (or the smallest), from above, and overall. */
export const niceBelow = value => [...NICE_AMOUNTS].reverse().find(a => a <= value) ?? NICE_AMOUNTS[0];
export const niceAbove = value => NICE_AMOUNTS.find(a => a >= value) ?? NICE_AMOUNTS[NICE_AMOUNTS.length - 1];
export const niceNearest = value => NICE_AMOUNTS.reduce((best, a) => (Math.abs(a - value) < Math.abs(best - value) ? a : best));

/**
 * The suggestion: { low, high, pick } in nice amounts, the place's cost
 * and the multipliers it came from.
 */
export function giftAdvice(choice = DEFAULT_CHOICE) {
  const { relation, people, venue, region, attend } = { ...DEFAULT_CHOICE, ...choice };
  const plate = PLATE[venue]?.[region] ?? PLATE.restaurant.big;
  const mult = (RELATIONS.find(r => r.value === relation) ?? RELATIONS[2]).mult;
  // Not going: nothing is eaten, so about half to two thirds of it
  const away = attend ? [1, 1] : [0.5, 0.7];
  const rawLow = plate[0] * people * mult[0] * away[0];
  const rawHigh = plate[1] * people * mult[1] * away[1];
  const low = niceBelow(rawLow);
  let high = niceAbove(rawHigh);
  if (high <= low) {
    high = niceAbove(low + 1);
  }
  const pick = niceNearest(Math.sqrt(rawLow * rawHigh));
  return { low, high, pick: Math.min(Math.max(pick, low), high), plate, mult, people, attend };
}

/** The choice from a link (?qh=close&ng=2&noi=hotel&kv=big&di=0), defaults for anything unknown. */
export function choiceFromQuery(params) {
  const pick = (key, list, fallback, cast = v => v) => {
    const value = cast(params.get(key));
    return list.some(o => o.value === value) ? value : fallback;
  };
  return {
    relation: pick('qh', RELATIONS, DEFAULT_CHOICE.relation),
    people: pick('ng', PEOPLE, DEFAULT_CHOICE.people, Number),
    venue: pick('noi', VENUES, DEFAULT_CHOICE.venue),
    region: pick('kv', REGIONS, DEFAULT_CHOICE.region),
    attend: params.get('di') !== '0',
  };
}

export function choiceToQuery(choice) {
  return new URLSearchParams({
    qh: choice.relation, ng: String(choice.people), noi: choice.venue, kv: choice.region, di: choice.attend ? '1' : '0',
  }).toString();
}
