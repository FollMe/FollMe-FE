import {
  CARD_TEXT, cardText, initialCardLang, loadCardLang, ordinal, saveCardLang, shortDayEn, urlCardLang,
} from './cardText';

beforeEach(() => localStorage.clear());

describe('ordinal', () => {
  it('says 1st, 2nd, 3rd, 11th, 22nd', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 30, 101, 111].map(ordinal))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '30th', '101st', '111th']);
  });
});

describe('shortDayEn', () => {
  it('reads the day in Vietnam', () => {
    expect(shortDayEn('2027-01-08T17:30:00Z')).toBe('Saturday, 9 January');
  });
});

describe('the two dictionaries', () => {
  // Every key of the Vietnamese card has its English word, nested ones too
  function shape(value) {
    if (Array.isArray(value)) {
      return `array${value.length}`;
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, shape(value[key])]));
    }
    return typeof value;
  }

  it('have the same keys', () => {
    expect(shape(CARD_TEXT.en)).toEqual(shape(CARD_TEXT.vi));
  });

  it('fall back to Vietnamese', () => {
    expect(cardText('fr')).toBe(CARD_TEXT.vi);
    expect(cardText()).toBe(CARD_TEXT.vi);
  });
});

describe('the cover', () => {
  it('greets the guest by name, or anyone', () => {
    const vi = cardText('vi');
    const en = cardText('en');
    expect(vi.cover({ name: 'Cô Ba', type: 'wedding', isOver: false }))
      .toEqual({ lead: 'Trân trọng kính mời ', who: 'Cô Ba', tail: '', line: 'tới dự lễ thành hôn của' });
    expect(vi.cover({ name: '', type: 'wedding', isOver: false }).who).toBe('bạn');
    expect(en.cover({ name: 'John', type: 'wedding', isOver: false }))
      .toEqual({ lead: 'Dear ', who: 'John', tail: ',', line: 'you are warmly invited to the wedding of' });
    expect(en.cover({ name: '', type: 'engagement', isOver: false }))
      .toEqual({ lead: 'You are warmly invited', who: '', tail: '', line: 'to the engagement ceremony of' });
    expect(en.cover({ name: 'John', type: 'wedding', isOver: true }))
      .toEqual({ lead: 'Thank you, ', who: 'John', tail: ',', line: 'for celebrating the wedding of' });
    expect(en.cover({ name: '', type: 'birthday', isOver: true }).line).toBe('for joining us at');
  });

  it('names tables and times in each language', () => {
    expect(cardText('vi').table('5')).toBe('Bàn 5');
    expect(cardText('en').table('5')).toBe('Table 5');
    expect(cardText('en').table('VIP')).toBe('VIP');
    const at = new Date(2027, 0, 16, 18, 30);
    expect(cardText('vi').when(at, false)).toBe('Thứ Bảy · 18:30');
    expect(cardText('vi').when(at, true)).toBe('Thứ Bảy · 18:30 (giờ Việt Nam)');
    expect(cardText('en').when(at, true)).toBe('Saturday, 16 January 2027 · 6:30 PM (Vietnam time)');
  });

  it('says the lunar date in English without the Vietnamese year name', () => {
    expect(cardText('en').lunar({ lunar: { day: 8, month: 12 }, yearName: 'Bính Ngọ' }))
      .toBe('Lunar calendar: day 8 of the 12th month');
    expect(cardText('vi').lunar({ lunar: { day: 8, month: 12 }, yearName: 'Bính Ngọ' }, 'tháng 12'))
      .toBe('Tức ngày 8 tháng 12 năm Bính Ngọ');
  });

  it('keeps the answer-by day in Vietnamese as before', () => {
    expect(cardText('vi').rsvp.day('2027-01-08T17:30:00Z')).toBe('thứ Bảy, 09/01');
    expect(cardText('en').rsvp.day('2027-01-08T17:30:00Z')).toBe('Saturday, 9 January');
  });
});

describe('initialCardLang', () => {
  it('Vietnamese by default', () => {
    expect(initialCardLang({ eventId: 'e1', search: '' })).toBe('vi');
  });

  it('English for a guest the host marked, or a ?lang=en link', () => {
    expect(initialCardLang({ eventId: 'e1', guest: { lang: 'en' }, search: '' })).toBe('en');
    expect(initialCardLang({ eventId: 'e1', search: '?lang=en' })).toBe('en');
    expect(urlCardLang('?lang=fr')).toBeNull();
  });

  it("this browser's own choice wins", () => {
    saveCardLang('e1', 'vi');
    expect(loadCardLang('e1')).toBe('vi');
    expect(initialCardLang({ eventId: 'e1', guest: { lang: 'en' }, search: '?lang=en' })).toBe('vi');
    expect(initialCardLang({ eventId: 'e2', guest: { lang: 'en' }, search: '' })).toBe('en');
  });

  it('ignores junk in storage', () => {
    localStorage.setItem('follme.cardLang.e1', 'xx');
    expect(loadCardLang('e1')).toBeNull();
  });
});
