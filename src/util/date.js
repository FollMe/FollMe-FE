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