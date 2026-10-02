// "Lưu vào lịch" without a library: a Google Calendar link, and an .ics
// file for iPhone and Outlook. Times are instants (UTC), so a guest abroad
// sees the party in their own time.

/** 2027-01-16T04:00:00Z -> "20270116T040000Z" */
function utcStamp(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl({ title, start, end, location, details }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    location: location ?? '',
    details: details ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Text as an iCalendar value: backslash, ; , and line breaks escaped. */
export function icsText(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Bytes of one character in UTF-8. */
function utf8Length(char) {
  const code = char.codePointAt(0);
  if (code < 0x80) {
    return 1;
  }
  if (code < 0x800) {
    return 2;
  }
  return code < 0x10000 ? 3 : 4;
}

/**
 * Folds a content line at 75 bytes (RFC 5545), never inside a character:
 * Vietnamese letters take two or three bytes in UTF-8.
 */
export function foldLine(line) {
  const parts = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = utf8Length(char);
    // Continuation lines start with a space, which counts too
    const limit = parts.length ? 74 : 75;
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** One event as an .ics file, with a reminder the day before. */
export function icsFile({ uid, title, start, end, location, description, url, now = new Date() }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FollMe//Thiep moi//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${icsText(title)}`,
    location && `LOCATION:${icsText(location)}`,
    description && `DESCRIPTION:${icsText(description)}`,
    url && `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/**
 * Downloads the file; opening it adds the event (iPhone offers "Add to
 * Calendar", Android and computers hand it to their calendar app).
 */
export function openIcs(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
