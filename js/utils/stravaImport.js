/**
 * stravaImport.js - Parse Strava CSV exports into run objects
 * Supports the activities.csv file from a Strava bulk data export
 */

import { getSettings } from '../data/storage.js';
import { getCurrentWeek } from '../utils/date.js';

/**
 * Parse a single CSV row, correctly handling quoted fields and escaped quotes
 * @param {string} line - Raw CSV line
 * @returns {Array} Array of field values
 */
function parseCSVRow(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'; // Escaped quote inside quoted field
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Parse a CSV string into an array of row objects keyed by header name
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of row objects
 */
function parseCSV(csvText) {
    // Normalise line endings
    const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVRow(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVRow(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim().replace(/^"|"$/g, '')] = (values[index] || '').replace(/^"|"$/g, '');
        });
        rows.push(row);
    }

    return rows;
}

/**
 * Parse Strava's date format to an ISO date string (YYYY-MM-DD)
 * Handles formats like "Jan 5, 2026, 8:15:12 AM" and "2026-01-05 08:15:12 UTC"
 * @param {string} dateStr - Strava date string
 * @returns {string|null} ISO date string or null on failure
 */
function parseStravaDate(dateStr) {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        // fall through
    }
    return null;
}

/**
 * Infer run type from the activity name and distance.
 * Checks activity name keywords first, then falls back to distance thresholds.
 * @param {string} name - Strava activity name
 * @param {number} distanceKm - Distance in km
 * @returns {string} Run type matching the app's schema
 */
function inferRunType(name, distanceKm) {
    const nameLower = (name || '').toLowerCase();

    if (nameLower.includes('parkrun') || nameLower.includes('park run')) return 'parkrun';
    if (nameLower.includes('treadmill') || nameLower.includes('indoor')) return 'treadmill';
    if (nameLower.includes('interval') || nameLower.includes('speed') || nameLower.includes('track')) return 'intervals';
    if (nameLower.includes('tempo')) return 'tempo';
    if (nameLower.includes('recovery')) return 'recovery';
    if (nameLower.includes('long run') || nameLower.includes('long run')) return 'long';

    // Distance-based inference
    if (distanceKm >= 4.8 && distanceKm <= 5.3) return 'parkrun';
    if (distanceKm >= 8) return 'long';
    return 'easy';
}

/**
 * Parse a Strava activities.csv export into run objects compatible with this app.
 *
 * Strava exports Distance in either metres (most common) or km depending on
 * account settings. Values > 100 are treated as metres and divided by 1000.
 *
 * @param {string} csvText - Raw content of Strava's activities.csv
 * @returns {Object} { runs: Array, skipped: number, errors: string[] }
 */
export function parseStravaCSV(csvText) {
    const rows = parseCSV(csvText);
    const settings = getSettings();
    const planStart = settings.trainingPlanStart;

    const runs = [];
    const errors = [];
    let skipped = 0;

    const RUNNING_TYPES = ['Run', 'Virtual Run', 'Trail Run', 'Treadmill'];

    for (const row of rows) {
        // Only import running activities
        const activityType = (row['Activity Type'] || '').trim();
        if (!RUNNING_TYPES.includes(activityType)) {
            skipped++;
            continue;
        }

        // Parse date
        const date = parseStravaDate(row['Activity Date']);
        if (!date) {
            errors.push(`Could not parse date: "${row['Activity Date']}"`);
            continue;
        }

        // Parse distance — Strava exports in metres when value > 100, else km
        const distanceRaw = parseFloat(row['Distance']);
        if (isNaN(distanceRaw) || distanceRaw <= 0) {
            errors.push(`Invalid distance for activity on ${date}`);
            continue;
        }
        const distanceKm = distanceRaw > 100 ? distanceRaw / 1000 : distanceRaw;

        // Parse elapsed time (seconds)
        const elapsedTime = parseInt(row['Elapsed Time'], 10);
        if (isNaN(elapsedTime) || elapsedTime <= 0) {
            errors.push(`Invalid time for activity on ${date}`);
            continue;
        }

        // Pace in seconds per km
        const pace = distanceKm > 0 ? Math.round(elapsedTime / distanceKm) : 0;

        // Heart rate (optional)
        const heartRateRaw = parseInt(row['Average Heart Rate'], 10);
        const heartRate = (!isNaN(heartRateRaw) && heartRateRaw > 0) ? heartRateRaw : undefined;

        const activityName = row['Activity Name'] || '';
        const runType = activityType === 'Treadmill' && !activityName.toLowerCase().includes('parkrun')
            ? 'treadmill'
            : inferRunType(activityName, distanceKm);

        // Calculate training week (null if outside plan range)
        const week = getCurrentWeek(date, planStart);
        const trainingWeek = (week >= 1 && week <= 44) ? week : null;

        // Use Strava Activity ID for a stable ID to help with deduplication
        const stravaId = row['Activity ID'] || `${date}_${distanceKm}`;

        runs.push({
            id: `run_strava_${stravaId}`,
            date,
            type: runType,
            distance: Math.round(distanceKm * 100) / 100,
            time: elapsedTime,
            pace,
            notes: activityName,
            gym: false,
            bodyweight: false,
            week: trainingWeek,
            ...(heartRate !== undefined && { heartRate }),
            source: 'strava'
        });
    }

    return { runs, skipped, errors };
}

/**
 * Filter out imported runs that already exist in the app.
 * A run is considered a duplicate if it has the same date and a distance
 * within 0.2 km of an existing run.
 *
 * @param {Array} importedRuns - Parsed runs from Strava
 * @param {Array} existingRuns - Runs already stored in the app
 * @returns {Object} { newRuns: Array, duplicateCount: number }
 */
export function deduplicateRuns(importedRuns, existingRuns) {
    let duplicateCount = 0;

    const newRuns = importedRuns.filter(imported => {
        const isDuplicate = existingRuns.some(existing =>
            existing.date === imported.date &&
            Math.abs(existing.distance - imported.distance) < 0.2
        );
        if (isDuplicate) {
            duplicateCount++;
            return false;
        }
        return true;
    });

    return { newRuns, duplicateCount };
}
