/**
 * Date.js - Date utilities for the running dashboard
 * All functions work with ISO date strings (YYYY-MM-DD) to avoid timezone issues
 */

/**
 * Parse an ISO date string to a Date object
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
export function parseDate(dateString) {
    // Parse as local date (not UTC) to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format a date object or ISO string to readable format
 * @param {Date|string} date - Date object or ISO string
 * @param {string} format - Format style: 'long' (Jan 10, 2026), 'short' (1/10/26), 'iso' (2026-01-10)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'long') {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;

    if (format === 'iso') {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    if (format === 'short') {
        return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${String(dateObj.getFullYear()).slice(2)}`;
    }

    // Default: 'long' format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

/**
 * Get today's date as ISO string
 * @returns {string} Today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO() {
    const today = new Date();
    return formatDate(today, 'iso');
}

/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {string} New date as ISO string
 */
export function addDays(date, days) {
    const dateObj = typeof date === 'string' ? parseDate(date) : new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return formatDate(dateObj, 'iso');
}

/**
 * Get day of week (0=Sunday, 6=Saturday)
 * @param {Date|string} date - Date to check
 * @returns {number} Day of week (0-6)
 */
export function getDayOfWeek(date) {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    return dateObj.getDay();
}

/**
 * Get the Monday of the week containing the given date
 * @param {Date|string} date - Date in the week
 * @returns {string} Monday's date as ISO string
 */
export function getWeekStartMonday(date) {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    const day = dateObj.getDay();

    // Calculate days to subtract to get to Monday (day 1)
    // Sunday (0) -> subtract 6, Monday (1) -> subtract 0, Tuesday (2) -> subtract 1, etc.
    const daysToSubtract = day === 0 ? 6 : day - 1;

    return addDays(dateObj, -daysToSubtract);
}

/**
 * Get the date range for a week (Monday to Sunday)
 * @param {Date|string} date - Any date in the week
 * @returns {Object} { start: ISO string, end: ISO string }
 */
export function getWeekRange(date) {
    const monday = getWeekStartMonday(date);
    const sunday = addDays(monday, 6);
    return { start: monday, end: sunday };
}

/**
 * Calculate which training week a date falls in
 * @param {string} date - Date to check (ISO string)
 * @param {string} planStartDate - Training plan start date (ISO string)
 * @returns {number} Week number (1-44), or 0 if before plan start, or 45+ if after plan end
 */
export function getCurrentWeek(date, planStartDate) {
    const checkDate = parseDate(date);
    const startDate = parseDate(planStartDate);

    // Calculate difference in days
    const diffTime = checkDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If before plan start, return 0
    if (diffDays < 0) return 0;

    // Calculate week number (1-indexed)
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber;
}

/**
 * Get the date range for a specific training week
 * @param {string} planStartDate - Training plan start date (ISO string, should be a Monday)
 * @param {number} weekNumber - Week number (1-44)
 * @returns {Object} { start: ISO string, end: ISO string }
 */
export function getWeekDateRange(planStartDate, weekNumber) {
    // Week 1 starts on planStartDate, Week 2 starts 7 days later, etc.
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = addDays(planStartDate, daysToAdd);
    const weekEnd = addDays(weekStart, 6);

    return { start: weekStart, end: weekEnd };
}

/**
 * Format a date range as a readable string
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {string} Formatted range (e.g., "Jan 5 - 11, 2026")
 */
export function formatDateRange(startDate, endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // If same month and year
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    // If same year but different month
    if (start.getFullYear() === end.getFullYear()) {
        return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }

    // Different years
    return `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

/**
 * Calculate days between two dates
 * @param {string} fromDate - Start date (ISO string)
 * @param {string} toDate - End date (ISO string)
 * @returns {number} Number of days (positive if toDate is after fromDate)
 */
export function daysBetween(fromDate, toDate) {
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    const diffTime = to - from;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate weeks between two dates
 * @param {string} fromDate - Start date (ISO string)
 * @param {string} toDate - End date (ISO string)
 * @returns {number} Number of weeks (rounded down)
 */
export function weeksBetween(fromDate, toDate) {
    const days = daysBetween(fromDate, toDate);
    return Math.floor(days / 7);
}

/**
 * Check if a date is in the past
 * @param {string} date - Date to check (ISO string)
 * @returns {boolean} True if date is before today
 */
export function isPast(date) {
    const checkDate = parseDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
}

/**
 * Check if a date is in the future
 * @param {string} date - Date to check (ISO string)
 * @returns {boolean} True if date is after today
 */
export function isFuture(date) {
    const checkDate = parseDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate > today;
}

/**
 * Check if a date is today
 * @param {string} date - Date to check (ISO string)
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
    const checkDate = parseDate(date);
    const today = new Date();
    return checkDate.toDateString() === today.toDateString();
}

/**
 * Get day name from date
 * @param {Date|string} date - Date to check
 * @returns {string} Day name (e.g., "Monday")
 */
export function getDayName(date) {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
}

/**
 * Get month name from date
 * @param {Date|string} date - Date to check
 * @returns {string} Month name (e.g., "January")
 */
export function getMonthName(date) {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[dateObj.getMonth()];
}
