/**
 * sanitize.js - String sanitization helpers for safe HTML rendering
 */

/**
 * Escape a string for safe HTML interpolation.
 * @param {string} value - Raw string
 * @returns {string} Escaped HTML-safe string
 */
export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
