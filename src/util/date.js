export function formatDate(date) {
    const d = new Date(date);
    if (!isValidDate(d)) {
        return "Không xác định"
    }

    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [day, month, year].join('-');
}
 
export function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
  }

/**
 * Formats a date for display, e.g. "28 tháng 12, 2024".
 */
export function formatLongDate(date) {
    const d = new Date(date);
    if (!isValidDate(d)) {
        return "Không xác định"
    }
    return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

/**
 * Estimates the reading time (in minutes) of a text or HTML string.
 */
export function getReadingMinutes(content = '') {
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
}

// Events take place in Vietnam: UTC+7 all year, no daylight saving.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * A Date whose local fields (getHours, getDate, dayjs().format...) read as
 * the wall clock in Vietnam at `date`, wherever the viewer is. For display
 * only: do not do arithmetic or send it to the server.
 */
export function vnWallClock(date) {
    const vn = new Date(new Date(date).getTime() + VN_OFFSET_MS);
    return new Date(
        vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(),
        vn.getUTCHours(), vn.getUTCMinutes(), vn.getUTCSeconds(),
    );
}
