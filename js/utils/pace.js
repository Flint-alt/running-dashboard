/**
 * Pace.js - Pace calculation and time formatting utilities
 * Running Training Dashboard
 */

/**
 * Calculate pace in seconds per kilometer
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} timeSeconds - Time in seconds
 * @returns {number} Pace in seconds per kilometer
 *
 * Example: calculatePace(5, 1500) => 300 (5:00/km)
 */
export function calculatePace(distanceKm, timeSeconds) {
    // Prevent division by zero
    if (distanceKm <= 0) return 0;

    // Pace = total time / total distance
    return timeSeconds / distanceKm;
}

/**
 * Format pace as min:sec per kilometer
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @returns {string} Formatted pace (e.g., "5:23/km")
 */
export function formatPace(secondsPerKm) {
    if (secondsPerKm <= 0) return '-';

    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Format pace without the "/km" suffix (for display flexibility)
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @returns {string} Formatted pace (e.g., "5:23")
 */
export function formatPaceShort(secondsPerKm) {
    if (secondsPerKm <= 0) return '-';

    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration (total time) as HH:MM:SS or MM:SS
 * @param {number} totalSeconds - Total time in seconds
 * @returns {string} Formatted duration
 *
 * Examples:
 * - 1845 seconds => "30:45"
 * - 3665 seconds => "1:01:05"
 */
export function formatDuration(totalSeconds) {
    if (totalSeconds <= 0) return '0:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to seconds
 * Accepts formats: "HH:MM:SS", "MM:SS", or "SS"
 * @param {string} timeString - Time string to parse
 * @returns {number} Total seconds
 *
 * Examples:
 * - "1:30:45" => 5445 seconds
 * - "30:00" => 1800 seconds
 * - "45" => 45 seconds
 */
export function parseTime(timeString) {
    // Remove any whitespace
    timeString = timeString.trim();

    // Split by colon
    const parts = timeString.split(':').map(Number);

    // Validate that all parts are numbers
    if (parts.some(isNaN)) {
        return 0;
    }

    if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // SS (just seconds)
        return parts[0];
    }

    return 0;
}

/**
 * Validate time string format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid format
 */
export function isValidTimeFormat(timeString) {
    // Accept formats: HH:MM:SS, MM:SS, or just numbers
    const timePattern = /^(\d{1,2}):([0-5]\d)(:([0-5]\d))?$/;
    return timePattern.test(timeString.trim()) || !isNaN(Number(timeString));
}

/**
 * Calculate total distance from multiple runs
 * @param {Array} runs - Array of run objects
 * @returns {number} Total distance in km
 */
export function calculateTotalDistance(runs) {
    return runs.reduce((total, run) => total + (run.distance || 0), 0);
}

/**
 * Calculate total time from multiple runs
 * @param {Array} runs - Array of run objects
 * @returns {number} Total time in seconds
 */
export function calculateTotalTime(runs) {
    return runs.reduce((total, run) => total + (run.time || 0), 0);
}

/**
 * Calculate average pace from multiple runs
 * @param {Array} runs - Array of run objects
 * @returns {number} Average pace in seconds per kilometer
 */
export function calculateAveragePace(runs) {
    if (runs.length === 0) return 0;

    const totalDistance = calculateTotalDistance(runs);
    const totalTime = calculateTotalTime(runs);

    if (totalDistance === 0) return 0;

    return totalTime / totalDistance;
}

/**
 * Get the fastest pace from multiple runs
 * @param {Array} runs - Array of run objects
 * @returns {number} Fastest pace in seconds per kilometer
 */
export function getFastestPace(runs) {
    if (runs.length === 0) return 0;

    // Filter out invalid paces
    const validPaces = runs
        .filter(run => run.pace > 0)
        .map(run => run.pace);

    if (validPaces.length === 0) return 0;

    return Math.min(...validPaces);
}

/**
 * Get the slowest pace from multiple runs
 * @param {Array} runs - Array of run objects
 * @returns {number} Slowest pace in seconds per kilometer
 */
export function getSlowestPace(runs) {
    if (runs.length === 0) return 0;

    const validPaces = runs
        .filter(run => run.pace > 0)
        .map(run => run.pace);

    if (validPaces.length === 0) return 0;

    return Math.max(...validPaces);
}

/**
 * Calculate predicted finish time for a distance at a given pace
 * @param {number} distanceKm - Target distance in km
 * @param {number} paceSecondsPerKm - Pace in seconds per km
 * @returns {number} Predicted time in seconds
 */
export function predictFinishTime(distanceKm, paceSecondsPerKm) {
    return distanceKm * paceSecondsPerKm;
}

/**
 * Convert pace between km and miles
 * @param {number} paceSecondsPerKm - Pace in seconds per kilometer
 * @returns {number} Pace in seconds per mile
 */
export function convertPaceKmToMile(paceSecondsPerKm) {
    // 1 mile = 1.60934 km
    return paceSecondsPerKm * 1.60934;
}

/**
 * Format distance with appropriate precision
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted distance (e.g., "5.00 km")
 */
export function formatDistance(distanceKm, decimals = 2) {
    if (distanceKm === 0) return '0 km';
    return `${distanceKm.toFixed(decimals)} km`;
}

/**
 * Determine pace category based on seconds per km
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @returns {string} Category: 'fast', 'moderate', 'easy', 'recovery'
 *
 * Categories based on typical running paces:
 * - Fast: < 4:30/km (race pace)
 * - Moderate: 4:30-6:00/km (tempo/steady)
 * - Easy: 6:00-8:00/km (easy/long run)
 * - Recovery: > 8:00/km (recovery)
 */
export function getPaceCategory(secondsPerKm) {
    if (secondsPerKm === 0) return 'unknown';
    if (secondsPerKm < 270) return 'fast';      // < 4:30/km
    if (secondsPerKm < 360) return 'moderate';  // 4:30-6:00/km
    if (secondsPerKm < 480) return 'easy';      // 6:00-8:00/km
    return 'recovery';                          // > 8:00/km
}

/**
 * Calculate speed in km/h from pace
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @returns {number} Speed in kilometers per hour
 */
export function paceToSpeed(secondsPerKm) {
    if (secondsPerKm === 0) return 0;
    return 3600 / secondsPerKm;
}

/**
 * Calculate pace from speed in km/h
 * @param {number} speedKmh - Speed in kilometers per hour
 * @returns {number} Pace in seconds per kilometer
 */
export function speedToPace(speedKmh) {
    if (speedKmh === 0) return 0;
    return 3600 / speedKmh;
}
