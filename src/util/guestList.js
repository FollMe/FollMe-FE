// The guest list typed or pasted as text, one guest per line.

export const MAX_GUEST_NAME = 100;
export const MAX_GUESTS_PER_SAVE = 500;

// Shortcuts shown under the list: how people are named on invitations
export const NAME_PREFIXES = ['Anh', 'Chị', 'Cô', 'Chú', 'Bác', 'Em', 'Gia đình'];
export const NAME_SUFFIXES = ['& người thương', '& gia đình'];

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
// "1. ", "2) ", "- ", "• " from lists copied out of notes or chats
const LIST_MARKER_RE = /^\s*(?:[-*•+–]|\d{1,3}\s*[.)\]:-]|\(\d{1,3}\))\s*/;

const key = name => name.toLocaleLowerCase('vi');

/**
 * One line of the list as a guest, or null for a blank line. Pasted Excel
 * rows keep their first cell. "Tên | email" still works for those who
 * want the invitation mailed, though the form no longer asks for it.
 */
export function parseGuestLine(line) {
  let [name, email] = line.split('\t')[0].split('|');
  name = name.replace(LIST_MARKER_RE, '').replace(/\s+/g, ' ').trim();
  if (!name) {
    return null;
  }
  email = email?.trim().toLowerCase();
  return EMAIL_RE.test(email ?? '') ? { name, email } : { name };
}

/**
 * The guests in the text, without repeats (also of `existing` names, the
 * guests already invited). Reports what was left out and why.
 */
export function parseGuestList(text, existing = []) {
  const invited = new Set(existing.map(key));
  const seen = new Set();
  const result = { guests: [], repeated: [], alreadyInvited: [], tooLong: [] };
  for (const line of text.split(/\r?\n/)) {
    const guest = parseGuestLine(line);
    if (!guest) {
      continue;
    }
    const k = key(guest.name);
    if (guest.name.length > MAX_GUEST_NAME) {
      result.tooLong.push(guest.name);
    } else if (invited.has(k)) {
      result.alreadyInvited.push(guest.name);
    } else if (seen.has(k)) {
      result.repeated.push(guest.name);
    } else {
      seen.add(k);
      result.guests.push(guest);
    }
  }
  return result;
}

/** The line around `caret`: its start and end offsets in `text`. */
export function lineAt(text, caret) {
  const start = text.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  const newline = text.indexOf('\n', caret);
  return { start, end: newline === -1 ? text.length : newline };
}

/** "Tuấn" -> "Anh Tuấn"; swaps a prefix that is already there. */
export function withPrefix(line, prefix) {
  const name = line.replace(LIST_MARKER_RE, '').trim();
  const current = NAME_PREFIXES.find(p => key(name).startsWith(`${key(p)} `));
  const rest = current ? name.slice(current.length + 1) : name;
  return rest ? `${prefix} ${rest}` : `${prefix} `;
}

/** "Anh Tuấn" -> "Anh Tuấn & người thương"; swaps a suffix already there. */
export function withSuffix(line, suffix) {
  const name = line.trim();
  if (!name) {
    return line;
  }
  const current = NAME_SUFFIXES.find(s => name.endsWith(s));
  const base = current ? name.slice(0, -current.length).trim() : name;
  return `${base} ${suffix}`;
}

/** Adds names at the end of the list, one per line. */
export function appendNames(text, names) {
  const clean = names.map(n => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!clean.length) {
    return text;
  }
  const head = text.trimEnd();
  return `${head ? `${head}\n` : ''}${clean.join('\n')}\n`;
}
