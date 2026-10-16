// The printed seating sheets: guests by name (a board at the entrance, to
// find one's table) or by table (for the venue and the MC).
import { compareTables, seatsNeeded } from './seating';
import { normalizeText } from './search';
import { vegetarianOf } from './invitation';

/** The letter a name is filed under: "Đức" under Đ, "Út" under U. */
export function nameLetter(name) {
  const first = (name ?? '').trim().charAt(0);
  if (!first) {
    return '#';
  }
  if (first === 'Đ' || first === 'đ') {
    return 'Đ';
  }
  const plain = normalizeText(first).toUpperCase();
  return /[A-Z]/.test(plain) ? plain : '#';
}

const collator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

/** Seated guests by name, in sections per letter: [{ letter, rows: [{ name, table, people }] }]. */
export function byName(guests) {
  const rows = guests
    .filter(g => g.table)
    .map(g => ({ id: g._id, name: g.name, table: g.table, people: seatsNeeded(g) || 1 }))
    .sort((a, b) => collator.compare(a.name, b.name) || compareTables(a.table, b.table));
  const sections = [];
  for (const row of rows) {
    const letter = nameLetter(row.name);
    if (sections[sections.length - 1]?.letter !== letter) {
      sections.push({ letter, rows: [] });
    }
    sections[sections.length - 1].rows.push(row);
  }
  return sections;
}

/** Tables in order with their guests by name: [{ table, people, vegetarian, guests: [{ name, people, vegetarian }] }]. */
export function byTable(guests) {
  const tables = new Map();
  for (const g of guests) {
    if (!g.table) {
      continue;
    }
    const row = tables.get(g.table) ?? { table: g.table, people: 0, vegetarian: 0, guests: [] };
    const people = seatsNeeded(g) || 1;
    const vegetarian = Math.min(vegetarianOf(g), people);
    row.people += people;
    row.vegetarian += vegetarian;
    row.guests.push({ id: g._id, name: g.name, group: g.group ?? '', people, vegetarian });
    tables.set(g.table, row);
  }
  return [...tables.values()]
    .sort((a, b) => compareTables(a.table, b.table))
    .map(t => ({ ...t, guests: t.guests.sort((a, b) => collator.compare(a.name, b.name)) }));
}
