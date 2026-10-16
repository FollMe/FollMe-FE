import {
  guestShuttle, newShuttleRow, seatsLeft, shuttleRiders, shuttleRowError, shuttleWhen, tidyShuttleRows, toShuttleRows,
} from './shuttles';

const bus = { _id: 'b1', label: 'Xe từ TP.HCM', time: '06:00', from: 'Ngã tư Hàng Xanh', seats: 45, taken: 40 };
const event = { shuttles: [bus, { _id: 'b2', label: 'Xe Biên Hoà', time: '06:30', seats: 16 }] };

describe('seatsLeft', () => {
  it('counts the free seats, and the guest’s own', () => {
    expect(seatsLeft(bus)).toBe(5);
    expect(seatsLeft(bus, { rsvp: { status: 'attending', count: 3, shuttle: 'b1' } })).toBe(8);
    // Not coming: their old seats are not theirs to count
    expect(seatsLeft(bus, { rsvp: { status: 'declined', count: 0, shuttle: 'b1' } })).toBe(5);
    expect(seatsLeft({ ...bus, taken: 50 })).toBe(0);
    expect(seatsLeft({ seats: 16 })).toBe(16);
  });
});

describe('the buses and who is on them', () => {
  const guests = [
    { _id: 'g1', name: 'Cô Ba', group: 'Nhà gái', rsvp: { status: 'attending', count: 2, shuttle: 'b1' } },
    { _id: 'g2', name: 'Chú Tư', rsvp: { status: 'attending', count: 1, shuttle: 'b1' }, arrivedAt: '2027-01-16T03:00:00Z' },
    { _id: 'g3', name: 'Anh Đức', rsvp: { status: 'declined', count: 0, shuttle: 'b1' } },
    { _id: 'g4', name: 'Chị Hà', rsvp: { status: 'attending', count: 1, shuttle: 'gone' } },
    { _id: 'g5', name: 'Bạn Hùng', rsvp: { status: 'attending', count: 4, shuttle: 'b2' } },
  ];

  it('finds the bus of a guest coming', () => {
    expect(guestShuttle(event, guests[0])).toBe(bus);
    expect(guestShuttle(event, guests[2])).toBeNull();
    expect(guestShuttle(event, guests[3])).toBeNull();
    expect(guestShuttle(event, {})).toBeNull();
  });

  it('lists the riders per bus', () => {
    const [b1, b2] = shuttleRiders(event, guests);
    expect(b1.riders.map(r => [r.name, r.people, r.arrived])).toEqual([['Cô Ba', 2, false], ['Chú Tư', 1, true]]);
    expect(b1.taken).toBe(3);
    expect(b2.taken).toBe(4);
    expect(shuttleRiders({}, guests)).toEqual([]);
  });

  it('says when and where', () => {
    expect(shuttleWhen(bus)).toBe('06:00 · Ngã tư Hàng Xanh');
    expect(shuttleWhen({ time: '06:30' })).toBe('06:30');
  });
});

describe('form rows', () => {
  it('round-trips, keeping ids, dropping unnamed rows', () => {
    const rows = toShuttleRows([bus]);
    expect(rows[0]).toMatchObject({ _id: 'b1', label: 'Xe từ TP.HCM', seats: '45' });
    const fresh = { ...newShuttleRow(), label: '  Xe   Biên Hoà ', time: '06:30', from: ' ' };
    expect(tidyShuttleRows([...rows, fresh, newShuttleRow()])).toEqual([
      { _id: 'b1', label: 'Xe từ TP.HCM', time: '06:00', from: 'Ngã tư Hàng Xanh', seats: 45 },
      { label: 'Xe Biên Hoà', time: '06:30', from: '', seats: 29 },
    ]);
  });

  it('a named bus needs a time and 1 to 60 seats', () => {
    const row = { label: 'Xe', time: '06:00', from: '', seats: '29' };
    expect(shuttleRowError(row)).toBe(false);
    expect(shuttleRowError({ ...row, time: '' })).toBe(true);
    expect(shuttleRowError({ ...row, seats: '0' })).toBe(true);
    expect(shuttleRowError({ ...row, seats: '61' })).toBe(true);
    expect(shuttleRowError({ ...row, seats: '2.5' })).toBe(true);
    expect(shuttleRowError({ ...row, label: ' ', time: '' })).toBe(false);
  });
});
