import { ago, isNewAnswer, loadSeen, newsText, saveSeen, whatsNew } from './whatsNew';

const since = '2027-01-05T10:00:00Z';
const event = {
  guests: [
    { _id: '1', name: 'Cô Ba', rsvp: { status: 'attending', count: 2, respondedAt: '2027-01-06T08:00:00Z' } },
    { _id: '2', name: 'Chú Tư', rsvp: { status: 'declined', count: 0, respondedAt: '2027-01-07T08:00:00Z' } },
    { _id: '3', name: 'Bác Hai', rsvp: { status: 'attending', count: 1, respondedAt: '2027-01-04T08:00:00Z' } },
    { _id: '4', name: 'Anh Tuấn' },
  ],
  wishes: [
    { _id: 'w1', createdAt: '2027-01-06T09:00:00Z' },
    { _id: 'w2', createdAt: '2027-01-01T09:00:00Z' },
  ],
};

describe('whatsNew', () => {
  it('lists answers since the last visit, newest first, and new wishes', () => {
    const news = whatsNew(event, since);
    expect(news.answers.map(g => g.name)).toEqual(['Chú Tư', 'Cô Ba']);
    expect(news.wishes.map(w => w._id)).toEqual(['w1']);
    expect(newsText(news)).toBe('2 khách trả lời (1 sẽ đến, 1 không đến) · 1 lời chúc mới');
  });

  it('shows nothing on a first visit', () => {
    expect(whatsNew(event, null)).toEqual({ answers: [], wishes: [] });
    expect(newsText({ answers: [], wishes: [] })).toBe('');
    expect(isNewAnswer(event.guests[0], null)).toBe(false);
  });

  it('marks a new answer', () => {
    expect(event.guests.map(g => isNewAnswer(g, since))).toEqual([true, true, false, false]);
  });
});

describe('last visit and ago', () => {
  it('is remembered per event', () => {
    saveSeen('e1', since);
    expect(loadSeen('e1')).toBe(since);
    expect(loadSeen('e2')).toBeNull();
  });

  it('says how long ago', () => {
    const now = new Date('2027-01-07T10:00:00Z').getTime();
    expect(ago('2027-01-07T09:55:00Z', now)).toBe('5 phút trước');
    expect(ago('2027-01-07T07:00:00Z', now)).toBe('3 giờ trước');
    expect(ago('2027-01-05T10:00:00Z', now)).toBe('2 ngày trước');
    expect(ago('2027-01-07T10:00:00Z', now)).toBe('1 phút trước');
  });
});
