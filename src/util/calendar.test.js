import { foldLine, googleCalendarUrl, icsFile, icsText } from './calendar';

const event = {
  uid: '64b0000000000000000000e1@follme',
  title: 'Lễ thành hôn Đức & Hạnh',
  start: '2027-01-16T04:00:00.000Z',
  end: '2027-01-16T07:00:00.000Z',
  location: 'Trung tâm tiệc cưới Hoa Sen, 123 Lê Lợi, Huế',
  description: 'Thiệp mời: https://follme.vn/e/1',
  url: 'https://follme.vn/e/1',
  now: new Date('2026-10-02T10:00:00Z'),
};

describe('googleCalendarUrl', () => {
  it('carries the instants in UTC and the place', () => {
    const url = new URL(googleCalendarUrl({ ...event, details: event.description }));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20270116T040000Z/20270116T070000Z');
    expect(url.searchParams.get('text')).toBe('Lễ thành hôn Đức & Hạnh');
    expect(url.searchParams.get('location')).toBe(event.location);
  });
});

describe('icsFile', () => {
  const ics = icsFile(event);
  const lines = ics.split('\r\n');

  it('is one event with CRLF lines and a reminder the day before', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(lines).toContain('DTSTART:20270116T040000Z');
    expect(lines).toContain('DTEND:20270116T070000Z');
    expect(lines).toContain('DTSTAMP:20261002T100000Z');
    expect(lines).toContain('TRIGGER:-P1D');
    expect(lines).toContain('SUMMARY:Lễ thành hôn Đức & Hạnh');
  });

  it('escapes commas and keeps every line within 75 bytes', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('LOCATION:Trung tâm tiệc cưới Hoa Sen\\, 123 Lê Lợi\\, Huế');
    expect(lines.every(l => Buffer.byteLength(l, 'utf8') <= 75)).toBe(true);
  });

  it('leaves out empty fields', () => {
    expect(icsFile({ ...event, location: '', description: '', url: '' })).not.toMatch(/LOCATION|URL:/);
  });
});

describe('icsText and foldLine', () => {
  it('escapes the special characters', () => {
    expect(icsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });

  it('never splits a Vietnamese letter', () => {
    const line = `SUMMARY:${'Đức Hạnh '.repeat(20)}`;
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    for (const part of folded.split('\r\n')) {
      expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(75);
      expect(part).not.toContain('�');
    }
  });
});
