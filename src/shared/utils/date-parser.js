
// src/shared/utils/date-parser.js

class DateParser {
  static parse(input) {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^\d{4}$/.test(trimmed)) return this.parseYear(trimmed);
    if (/^\d{2}-\d{4}$/.test(trimmed)) return this.parseMonthYear(trimmed);
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return this.parseDayMonthYear(trimmed);
    if (/^\d{4}-\d{2}$/.test(trimmed)) return this.parseISOMonth(trimmed);
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return this.parseISODate(trimmed);
    throw new Error(`Invalid date format: ${input}. Supported: DD-MM-YYYY, MM-YYYY, YYYY, YYYY-MM, YYYY-MM-DD`);
  }

  static parseYear(year) {
    const y = parseInt(year);
    return { start: new Date(y, 0, 1, 0, 0, 0, 0).toISOString(), end: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(), description: `year ${year}`, type: 'year' };
  }

  static parseMonthYear(input) {
    const [month, year] = input.split('-');
    const m = parseInt(month) - 1, y = parseInt(year);
    if (m < 0 || m > 11) throw new Error(`Invalid month: ${month}`);
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString(), description: start.toLocaleString('en-US', { month: 'long', year: 'numeric' }), type: 'month' };
  }

  static parseDayMonthYear(input) {
    const [day, month, year] = input.split('-');
    const d = parseInt(day), m = parseInt(month) - 1, y = parseInt(year);
    if (m < 0 || m > 11) throw new Error(`Invalid month: ${month}`);
    if (d < 1 || d > 31) throw new Error(`Invalid day: ${day}`);
    const date = new Date(y, m, d);
    if (date.getDate() !== d || date.getMonth() !== m) throw new Error(`Invalid date: ${input}`);
    return { start: new Date(y, m, d, 0, 0, 0, 0).toISOString(), end: new Date(y, m, d, 23, 59, 59, 999).toISOString(), description: input, type: 'date' };
  }

  static parseISOMonth(input) {
    const [year, month] = input.split('-');
    const m = parseInt(month) - 1, y = parseInt(year);
    if (m < 0 || m > 11) throw new Error(`Invalid month: ${month}`);
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString(), description: start.toLocaleString('en-US', { month: 'long', year: 'numeric' }), type: 'month' };
  }

  static parseISODate(input) {
    const [year, month, day] = input.split('-');
    const d = parseInt(day), m = parseInt(month) - 1, y = parseInt(year);
    const date = new Date(y, m, d);
    if (date.getDate() !== d || date.getMonth() !== m) throw new Error(`Invalid date: ${input}`);
    return { start: new Date(y, m, d, 0, 0, 0, 0).toISOString(), end: new Date(y, m, d, 23, 59, 59, 999).toISOString(), description: input, type: 'date' };
  }
}

module.exports = DateParser;
