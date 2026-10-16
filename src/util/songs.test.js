import { songListText, songRequests } from './songs';

const guests = [
  { name: 'Cô Ba', rsvp: { status: 'attending', song: 'Ngày đầu tiên – Đức Phúc' } },
  { name: 'Anh Tuấn', rsvp: { status: 'maybe', song: 'ngay dau tien - duc phuc' } },
  { name: 'Chị Hà', rsvp: { status: 'attending', song: 'Hơn cả yêu' } },
  { name: 'Bác Hai', rsvp: { status: 'declined', song: 'Một nhà' } },
  { name: 'Em Vy', rsvp: { status: 'attending', song: '   ' } },
  { name: 'Bạn Long' },
];

describe('songRequests', () => {
  it('counts the same song once however it is typed, most asked first, not from those not coming', () => {
    expect(songRequests(guests)).toEqual([
      { song: 'Ngày đầu tiên – Đức Phúc', guests: ['Cô Ba', 'Anh Tuấn'] },
      { song: 'Hơn cả yêu', guests: ['Chị Hà'] },
    ]);
  });

  it('makes a list to paste to the band', () => {
    expect(songListText(songRequests(guests), 'Long & Vy')).toBe(
      'Bài hát khách muốn nghe · Long & Vy\n1. Ngày đầu tiên – Đức Phúc (2 khách)\n2. Hơn cả yêu',
    );
  });
});
