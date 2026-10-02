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

/**
 * The real moment of a Vietnam wall clock time: the inverse of vnWallClock.
 * `wall` is a Date (or dayjs) whose local fields hold the time in Vietnam,
 * e.g. what the host typed in the event form, wherever they are.
 */
export function fromVnWallClock(wall) {
    const d = new Date(wall);
    return new Date(Date.UTC(
        d.getFullYear(), d.getMonth(), d.getDate(),
        d.getHours(), d.getMinutes(), d.getSeconds(),
    ) - VN_OFFSET_MS);
}

/** True when the viewer's clock is not on Vietnam time. */
export function isAwayFromVietnam(at = new Date()) {
    return at.getTimezoneOffset() !== -VN_OFFSET_MS / 60000;
}
