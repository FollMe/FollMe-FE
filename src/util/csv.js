/**
 * One CSV cell. Text that a spreadsheet would run as a formula (guest names
 * typed on the public link are anyone's input) is prefixed with a quote.
 */
export function csvCell(value) {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

/** Saves rows as a .csv that Excel opens with Vietnamese intact (UTF-8 BOM). */
export function downloadCsv(filename, rows) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
