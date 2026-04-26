// src/utils/date-parser.js

/**
 * Smart date parser that supports multiple formats
 * Formats supported:
 * - YYYY (year only): 2026
 * - MM-YYYY (month-year): 04-2026
 * - DD-MM-YYYY (day-month-year): 25-04-2026
 * - YYYY-MM (ISO month): 2026-04
 * - YYYY-MM-DD (ISO date): 2026-04-25
 */

class DateParser {
  
  /**
   * Parse flexible date input and return ISO date range
   */
  static parse(input) {
    if (!input) return null;
    
    const trimmed = input.trim();
    
    // Format: YYYY (year only) - e.g., "2026"
    if (/^\d{4}$/.test(trimmed)) {
      return this.parseYear(trimmed);
    }
    
    // Format: MM-YYYY (month-year) - e.g., "04-2026"
    if (/^\d{2}-\d{4}$/.test(trimmed)) {
      return this.parseMonthYear(trimmed);
    }
    
    // Format: DD-MM-YYYY (day-month-year) - e.g., "25-04-2026"
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return this.parseDayMonthYear(trimmed);
    }
    
    // Format: YYYY-MM (ISO month) - e.g., "2026-04"
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return this.parseISOMonth(trimmed);
    }
    
    // Format: YYYY-MM-DD (ISO date) - e.g., "2026-04-25"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return this.parseISODate(trimmed);
    }
    
    throw new Error(`Invalid date format: ${input}. Supported formats: DD-MM-YYYY, MM-YYYY, YYYY, YYYY-MM, YYYY-MM-DD`);
  }
  
  /**
   * Parse year: 2026
   */
  static parseYear(year) {
    const y = parseInt(year);
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      description: `year ${year}`,
      type: 'year'
    };
  }
  
  /**
   * Parse month-year: 04-2026 or 4-2026
   */
  static parseMonthYear(input) {
    const [month, year] = input.split('-');
    const m = parseInt(month) - 1; // 0-indexed
    const y = parseInt(year);
    
    if (m < 0 || m > 11) {
      throw new Error(`Invalid month: ${month}. Must be 01-12`);
    }
    
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    
    const monthName = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      description: monthName,
      type: 'month'
    };
  }
  
  /**
   * Parse day-month-year: 25-04-2026
   */
  static parseDayMonthYear(input) {
    const [day, month, year] = input.split('-');
    const d = parseInt(day);
    const m = parseInt(month) - 1; // 0-indexed
    const y = parseInt(year);
    
    if (m < 0 || m > 11) {
      throw new Error(`Invalid month: ${month}. Must be 01-12`);
    }
    
    if (d < 1 || d > 31) {
      throw new Error(`Invalid day: ${day}. Must be 01-31`);
    }
    
    const date = new Date(y, m, d);
    
    // Validate the date is real (handles Feb 30, etc.)
    if (date.getDate() !== d || date.getMonth() !== m || date.getFullYear() !== y) {
      throw new Error(`Invalid date: ${input}`);
    }
    
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const end = new Date(y, m, d, 23, 59, 59, 999);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      description: input,
      type: 'date'
    };
  }
  
  /**
   * Parse ISO month: 2026-04
   */
  static parseISOMonth(input) {
    const [year, month] = input.split('-');
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    
    if (m < 0 || m > 11) {
      throw new Error(`Invalid month: ${month}. Must be 01-12`);
    }
    
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    
    const monthName = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      description: monthName,
      type: 'month'
    };
  }
  
  /**
   * Parse ISO date: 2026-04-25
   */
  static parseISODate(input) {
    const [year, month, day] = input.split('-');
    const d = parseInt(day);
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    
    const date = new Date(y, m, d);
    
    if (date.getDate() !== d || date.getMonth() !== m || date.getFullYear() !== y) {
      throw new Error(`Invalid date: ${input}`);
    }
    
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const end = new Date(y, m, d, 23, 59, 59, 999);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      description: input,
      type: 'date'
    };
  }
}

module.exports = DateParser;