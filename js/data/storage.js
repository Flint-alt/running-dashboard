/**
 * Storage.js - localStorage wrapper for data persistence
 * Handles all data storage operations for the running dashboard
 */

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
 * @returns {boolean} True if successful
 */
export function saveRun(run) {
    const store = getStore();

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

    // Check for milestone achievements
    checkMilestones(store);

    return setStore(store);
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
 */
function checkMilestones(store) {
    const runs = store.runs;

    // Check for 10k (10km or more)
    if (!store.milestones.first10k) {
        if (runs.some(run => run.distance >= 10)) {
            store.milestones.first10k = true;
            console.log('Milestone achieved: First 10K!');
        }
    }

    // Check for 15k
    if (!store.milestones.first15k) {
        if (runs.some(run => run.distance >= 15)) {
            store.milestones.first15k = true;
            console.log('Milestone achieved: First 15K!');
        }
    }

    // Check for 20k
    if (!store.milestones.first20k) {
        if (runs.some(run => run.distance >= 20)) {
            store.milestones.first20k = true;
            console.log('Milestone achieved: First 20K!');
        }
    }

    // Check for half marathon (21.1km or more)
    if (!store.milestones.halfMarathon) {
        if (runs.some(run => run.distance >= 21.1)) {
            store.milestones.halfMarathon = true;
            console.log('Milestone achieved: Half Marathon!');
        }
    }
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
