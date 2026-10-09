// The seating plan: guests at numbered tables ("12") or named ones ("VIP"),
// a fixed number of seats each. Vietnamese parties seat each side (nhà trai,
// nhà gái) and each circle of friends together, families never split.

export const DEFAULT_SEATS = 10;
export const MAX_SEATS = 30;
export const MAX_TABLE_NAME = 20;

/** "12" -> "Bàn 12"; a name the host typed stays as it is. */
export function tableLabel(table) {
  return /^\d+$/.test(table ?? '') ? `Bàn ${table}` : table;
}

/** Tables in the order people count them: 1, 2, 10, then names. */
export function compareTables(a, b) {
  return a.localeCompare(b, 'vi', { numeric: true });
}

/** Seats a guest takes: who came, else what they answered, else one; none if not coming. */
export function seatsNeeded(guest) {
  if (guest.arrivedAt) {
    return guest.arrivedCount || 1;
  }
  const { status, count } = guest.rsvp ?? {};
  if (status === 'declined') {
    return 0;
  }
  return (status === 'attending' || status === 'maybe') && count > 0 ? count : 1;
}

/**
 * The plan as it stands: every table with its guests and seats taken (in
 * table order), and who still needs a seat.
 */
export function seatingPlan(guests, seatsPerTable = DEFAULT_SEATS) {
  const tables = new Map();
  const unseated = [];
  for (const guest of guests) {
    if (guest.table) {
      const row = tables.get(guest.table) ?? { table: guest.table, guests: [], people: 0 };
      row.guests.push(guest);
      row.people += seatsNeeded(guest);
      tables.set(guest.table, row);
    } else if (seatsNeeded(guest) > 0) {
      unseated.push(guest);
    }
  }
  const list = [...tables.values()]
    .sort((a, b) => compareTables(a.table, b.table))
    .map(row => ({ ...row, free: seatsPerTable - row.people, group: mainGroup(row.guests) }));
  return {
    tables: list,
    unseated,
    seated: list.reduce((n, row) => n + row.people, 0),
    waiting: unseated.reduce((n, g) => n + seatsNeeded(g), 0),
  };
}

/** The group most of a table's people belong to ('' for none). */
function mainGroup(guests) {
  const counts = new Map();
  for (const g of guests) {
    counts.set(g.group || '', (counts.get(g.group || '') ?? 0) + seatsNeeded(g));
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

/** The next table number after the highest numbered one. */
export function nextTable(tables) {
  const numbers = tables.filter(t => /^\d+$/.test(t)).map(Number);
  return String(numbers.length ? Math.max(...numbers) + 1 : 1);
}

/**
 * Seats everyone who still needs a seat: each group at its own tables (a
 * table of that group with room first, else a new one), the biggest
 * families first so they are not split. Returns [{ guest, table }] for the
 * guests it seated and the new tables it opened.
 */
export function autoSeat(guests, seatsPerTable = DEFAULT_SEATS) {
  const plan = seatingPlan(guests, seatsPerTable);
  const tables = plan.tables.map(t => ({ table: t.table, group: t.group, free: t.free }));
  const byGroup = new Map();
  for (const guest of plan.unseated) {
    const key = guest.group || '';
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
    }
    byGroup.get(key).push(guest);
  }
  // Groups as first seen, guests without one last
  const groups = [...byGroup.keys()].sort((a, b) => (a === '') - (b === ''));
  const seats = [];
  const opened = [];
  for (const group of groups) {
    const party = [...byGroup.get(group)].sort((a, b) => seatsNeeded(b) - seatsNeeded(a));
    for (const guest of party) {
      const need = seatsNeeded(guest);
      let table = tables.find(t => t.group === group && t.free >= need);
      if (!table) {
        table = { table: nextTable(tables.map(t => t.table)), group, free: seatsPerTable };
        tables.push(table);
        opened.push(table.table);
      }
      table.free -= need;
      seats.push({ guest, table: table.table });
    }
  }
  return { seats, opened };
}

/** The plan as spreadsheet rows: one per guest, table by table. */
export function seatingRows(guests, seatsPerTable = DEFAULT_SEATS) {
  const plan = seatingPlan(guests, seatsPerTable);
  return [
    ['Bàn', 'Tên', 'Nhóm', 'Số người'],
    ...plan.tables.flatMap(t => t.guests.map(g => [tableLabel(t.table), g.name, g.group ?? '', seatsNeeded(g)])),
    ...plan.unseated.map(g => ['Chưa xếp', g.name, g.group ?? '', seatsNeeded(g)]),
  ];
}
