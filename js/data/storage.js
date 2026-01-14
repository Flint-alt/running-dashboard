/**
 * Storage.js - localStorage wrapper for data persistence
 * Handles all data storage operations for the running dashboard
 */

import { getTodayISO, getCurrentWeek } from '../utils/date.js';

// Storage key for all app data
const STORAGE_KEY = 'runningDashboard';

// Starting weight constant
const STARTING_WEIGHT = 74.5;

/**
 * Get the default empty store structure
 * @returns {Object} Default store with empty arrays and initial settings
 */
function getDefaultStore() {
    return {
        runs: [],
        weights: [],
        settings: {
            trainingPlanStart: '2026-01-05', // Monday, Week 1 starts Jan 5, 2026
            goalWeight: 65,
            startingWeight: STARTING_WEIGHT
        },
        milestones: {
            // Track when milestones are achieved
            first10k: false,
            first15k: false,
            first20k: false,
            halfMarathon: false
        }
    };
}

/**
 * Get the entire store from localStorage
 * @returns {Object} The complete data store
 */
function getStore() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Ensure all expected properties exist (for backwards compatibility)
            return {
                ...getDefaultStore(),
                ...parsed
            };
        }
    } catch (e) {
        console.error('Error reading from localStorage:', e);
    }
    return getDefaultStore();
}

/**
 * Save the entire store to localStorage
 * @param {Object} data - The complete data store to save
 * @returns {boolean} True if successful, false otherwise
 */
function setStore(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Consider exporting and clearing old data.');
            alert('Storage quota exceeded. Please export your data and clear old entries.');
        } else {
            console.error('Error writing to localStorage:', e);
        }
        return false;
    }
}

/**
 * Initialize storage with default structure if empty
 */
export function initializeStorage() {
    const store = getStore();
    setStore(store);
    console.log('Storage initialized:', store);
}

/**
 * Get all runs, sorted by date (newest first)
 * @returns {Array} Array of run objects
 */
export function getRuns() {
    const store = getStore();
    return store.runs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get a single run by ID
 * @param {string} id - The run ID
 * @returns {Object|null} The run object or null if not found
 */
export function getRun(id) {
    const store = getStore();
    return store.runs.find(run => run.id === id) || null;
}

/**
 * Save a new run or update existing run
 * @param {Object} run - The run object to save
 * @returns {Object} Object with success status and newly achieved milestone (if any)
 */
export function saveRun(run) {
    const store = getStore();
    const isNewRun = !run.id;

    // If no ID, this is a new run - generate ID
    if (!run.id) {
        run.id = `run_${Date.now()}`;
        store.runs.push(run);
    } else {
        // Update existing run
        const index = store.runs.findIndex(r => r.id === run.id);
        if (index !== -1) {
            store.runs[index] = run;
        } else {
            store.runs.push(run);
        }
    }

    // Check for milestone achievements (only for new runs)
    const newMilestone = isNewRun ? checkMilestones(store) : null;

    const success = setStore(store);
    return { success, milestone: newMilestone };
}

/**
 * Delete a run by ID
 * @param {string} id - The run ID to delete
 * @returns {boolean} True if successful
 */
export function deleteRun(id) {
    const store = getStore();
    store.runs = store.runs.filter(run => run.id !== id);
    return setStore(store);
}

/**
 * Get all weight entries, sorted by date (newest first)
 * @returns {Array} Array of weight objects
 */
export function getWeights() {
    const store = getStore();
    return store.weights.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Save a new weight entry
 * @param {Object} weight - The weight object to save
 * @returns {boolean} True if successful
 */
export function saveWeight(weight) {
    const store = getStore();

    // Check for existing entry on the same date (prevent duplicates)
    const existingIndex = store.weights.findIndex(w =>
        w.date === weight.date && w.id !== weight.id
    );

    if (existingIndex !== -1) {
        // Update existing entry for this date
        weight.id = store.weights[existingIndex].id; // Keep the same ID
        store.weights[existingIndex] = weight;
    } else if (!weight.id) {
        // New entry
        weight.id = `weight_${Date.now()}`;
        store.weights.push(weight);
    } else {
        // Update by ID
        const index = store.weights.findIndex(w => w.id === weight.id);
        if (index !== -1) {
            store.weights[index] = weight;
        } else {
            store.weights.push(weight);
        }
    }

    return setStore(store);
}

/**
 * Delete a weight entry by ID
 * @param {string} id - The weight entry ID to delete
 * @returns {boolean} True if successful
 */
export function deleteWeight(id) {
    const store = getStore();
    store.weights = store.weights.filter(w => w.id !== id);
    return setStore(store);
}

/**
 * Get app settings
 * @returns {Object} Settings object
 */
export function getSettings() {
    const store = getStore();
    return store.settings;
}

/**
 * Update app settings
 * @param {Object} settings - Updated settings
 * @returns {boolean} True if successful
 */
export function updateSettings(settings) {
    const store = getStore();
    store.settings = { ...store.settings, ...settings };
    return setStore(store);
}

/**
 * Get milestone completion status
 * @returns {Object} Milestones object
 */
export function getMilestones() {
    const store = getStore();
    return store.milestones;
}

/**
 * Check if any milestones have been achieved and update
 * @param {Object} store - The current store
 * @returns {string|null} Name of newly achieved milestone, or null if none
 */
function checkMilestones(store) {
    const runs = store.runs;
    let newMilestone = null;

    // Check for half marathon first (21.1km or more) - highest priority
    if (!store.milestones.halfMarathon) {
        if (runs.some(run => run.distance >= 21.1)) {
            store.milestones.halfMarathon = true;
            newMilestone = 'Half Marathon';
            console.log('Milestone achieved: Half Marathon!');
        }
    }

    // Check for 20k
    if (!newMilestone && !store.milestones.first20k) {
        if (runs.some(run => run.distance >= 20)) {
            store.milestones.first20k = true;
            newMilestone = 'First 20K';
            console.log('Milestone achieved: First 20K!');
        }
    }

    // Check for 15k
    if (!newMilestone && !store.milestones.first15k) {
        if (runs.some(run => run.distance >= 15)) {
            store.milestones.first15k = true;
            newMilestone = 'First 15K';
            console.log('Milestone achieved: First 15K!');
        }
    }

    // Check for 10k (10km or more)
    if (!newMilestone && !store.milestones.first10k) {
        if (runs.some(run => run.distance >= 10)) {
            store.milestones.first10k = true;
            newMilestone = 'First 10K';
            console.log('Milestone achieved: First 10K!');
        }
    }

    return newMilestone;
}

/**
 * Export all data as JSON
 * @returns {string} JSON string of all data
 */
export function exportData() {
    const store = getStore();
    return JSON.stringify(store, null, 2);
}

/**
 * Export runs as CSV
 * @returns {string} CSV string of all runs
 */
export function exportRunsAsCSV() {
    const runs = getRuns();

    if (runs.length === 0) {
        return 'No runs to export';
    }

    // CSV header
    const headers = ['Date', 'Week', 'Type', 'Distance (km)', 'Time (seconds)', 'Pace (min/km)', 'Gym', 'Bodyweight', 'Notes'];
    const csvRows = [headers.join(',')];

    // Add each run as a row
    runs.forEach(run => {
        const row = [
            run.date,
            run.week || '',
            run.type,
            run.distance.toFixed(2),
            run.time,
            (run.pace / 60).toFixed(2), // Convert seconds to minutes
            run.gym ? 'Yes' : 'No',
            run.bodyweight ? 'Yes' : 'No',
            `"${(run.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

/**
 * Import data from JSON string
 * @param {string} jsonString - JSON data to import
 * @returns {boolean} True if successful
 */
export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate structure
        if (!data.runs || !data.weights || !data.settings) {
            throw new Error('Invalid data structure');
        }

        return setStore(data);
    } catch (e) {
        console.error('Error importing data:', e);
        alert('Invalid data format. Please check your import file.');
        return false;
    }
}

/**
 * Clear all data (use with caution!)
 * @returns {boolean} True if successful
 */
export function clearAllData() {
    const confirmed = confirm(
        'Are you sure you want to clear ALL data? This cannot be undone.\n\n' +
        'Consider exporting your data first.'
    );

    if (confirmed) {
        const defaultStore = getDefaultStore();
        return setStore(defaultStore);
    }

    return false;
}

/**
 * Get runs for a specific week
 * @param {number} weekNumber - The training week number (1-44)
 * @returns {Array} Array of runs for that week
 */
export function getRunsForWeek(weekNumber) {
    const store = getStore();
    return store.runs.filter(run => run.week === weekNumber);
}

/**
 * Get total statistics
 * @returns {Object} Statistics object with totals
 */
export function getStatistics() {
    const runs = getRuns();

    if (runs.length === 0) {
        return {
            totalDistance: 0,
            totalTime: 0,
            totalRuns: 0,
            averagePace: 0,
            longestRun: 0
        };
    }

    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalTime = runs.reduce((sum, run) => sum + run.time, 0);
    const totalRuns = runs.length;
    const averagePace = totalDistance > 0 ? totalTime / totalDistance : 0;
    const longestRun = Math.max(...runs.map(run => run.distance));

    return {
        totalDistance,
        totalTime,
        totalRuns,
        averagePace,
        longestRun
    };
}

/**
 * Get current weight (most recent entry)
 * @returns {number|null} Current weight in kg, or starting weight if no entries
 */
export function getCurrentWeight() {
    const weights = getWeights();
    if (weights.length === 0) {
        return STARTING_WEIGHT;
    }
    return weights[0].weight;
}

/**
 * Get weight lost from starting weight
 * @returns {number} Weight lost in kg (positive number means weight lost)
 */
export function getWeightLost() {
    const currentWeight = getCurrentWeight();
    const settings = getSettings();
    return settings.startingWeight - currentWeight;
}

/**
 * Get weight progress percentage toward goal
 * @returns {number} Percentage (0-100)
 */
export function getWeightProgress() {
    const settings = getSettings();
    const currentWeight = getCurrentWeight();
    const totalToLose = settings.startingWeight - settings.goalWeight;
    const lost = settings.startingWeight - currentWeight;

    if (totalToLose <= 0) return 100;

    const progress = (lost / totalToLose) * 100;
    return Math.max(0, Math.min(100, progress));
}

/**
 * Get personal records from all runs
 * @returns {Object} Personal records object with fastest 5K, 10K, longest run, and best pace
 */
export function getRecords() {
    const runs = getRuns();

    if (runs.length === 0) {
        return {
            fastest5k: null,
            fastest10k: null,
            longestRun: null,
            bestPace: null
        };
    }

    // Find fastest 5K (must be at least 5km)
    const runs5k = runs.filter(run => run.distance >= 5);
    const fastest5k = runs5k.length > 0
        ? runs5k.reduce((best, run) => {
            const runPaceFor5k = (run.time / run.distance) * 5; // Normalize to 5k time
            const bestPaceFor5k = (best.time / best.distance) * 5;
            return runPaceFor5k < bestPaceFor5k ? run : best;
        })
        : null;

    // Find fastest 10K (must be at least 10km)
    const runs10k = runs.filter(run => run.distance >= 10);
    const fastest10k = runs10k.length > 0
        ? runs10k.reduce((best, run) => {
            const runPaceFor10k = (run.time / run.distance) * 10; // Normalize to 10k time
            const bestPaceFor10k = (best.time / best.distance) * 10;
            return runPaceFor10k < bestPaceFor10k ? run : best;
        })
        : null;

    // Find longest run
    const longestRun = runs.reduce((longest, run) =>
        run.distance > longest.distance ? run : longest
    );

    // Find best pace (fastest pace per km)
    const bestPace = runs.reduce((fastest, run) =>
        run.pace < fastest.pace ? run : fastest
    );

    return {
        fastest5k,
        fastest10k,
        longestRun,
        bestPace
    };
}

/**
 * Get run streak (consecutive weeks with at least one run)
 * @returns {Object} Streak information: {current: number, longest: number}
 */
export function getRunStreak() {
    const runs = getRuns();
    const settings = getSettings();

    if (runs.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Get all unique week numbers that have runs
    const weeksWithRuns = new Set();
    runs.forEach(run => {
        if (run.week) {
            weeksWithRuns.add(run.week);
        }
    });

    // Sort week numbers
    const sortedWeeks = Array.from(weeksWithRuns).sort((a, b) => a - b);

    // Calculate current streak (working backwards from current week)
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    let currentStreak = 0;
    for (let i = currentWeek; i >= 1; i--) {
        if (weeksWithRuns.has(i)) {
            currentStreak++;
        } else {
            break; // Streak is broken
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastWeek = 0;

    for (const week of sortedWeeks) {
        if (lastWeek === 0 || week === lastWeek + 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1; // Reset streak
        }
        lastWeek = week;
    }

    return {
        current: currentStreak,
        longest: Math.max(longestStreak, currentStreak)
    };
}
