/**
 * logRun.js - Run logging form view
 * Handles run entry with auto-pace calculation and validation
 */

import { saveRun, getRun, getSettings } from '../data/storage.js';
import { getTodayISO, getCurrentWeek } from '../utils/date.js';
import { calculatePace, formatPace, parseTime, isValidTimeFormat, formatDuration } from '../utils/pace.js';
import { getPhaseForWeek } from '../data/trainingPlan.js';
import { refreshCurrentPage } from '../components/navigation.js';

// Debounce timeout reference
let paceCalculationTimeout = null;

/**
 * Initialize the log run form
 * Sets up event listeners and default values
 */
export function initLogRun() {
    const form = document.getElementById('log-run-form');
    const dateInput = document.getElementById('run-date');
    const distanceInput = document.getElementById('run-distance');
    const timeInput = document.getElementById('run-time');
    const paceDisplay = document.getElementById('calculated-pace');
    const submitButton = form.querySelector('button[type="submit"]');

    // Clear any previous messages
    clearMessages();

    // Check if we're editing an existing run
    const editingRunId = localStorage.getItem('editingRunId');

    if (editingRunId) {
        // Load the run data
        const run = getRun(editingRunId);

        if (run) {
            // Populate the form
            populateFormWithRun(run);
            submitButton.textContent = 'Update Run';

            // Store the run ID in the form for later use
            form.dataset.editingRunId = editingRunId;
        }

        // Clear the editing flag
        localStorage.removeItem('editingRunId');
    } else {
        // New run mode - clear form
        form.reset();
        dateInput.value = getTodayISO();
        submitButton.textContent = 'Log Run';
        delete form.dataset.editingRunId;
    }

    // Remove old event listeners to prevent memory leaks
    distanceInput.removeEventListener('input', debouncedUpdatePaceCalculation);
    timeInput.removeEventListener('input', debouncedUpdatePaceCalculation);
    form.removeEventListener('submit', handleFormSubmit);

    // Calculate pace when distance or time changes (debounced for performance)
    distanceInput.addEventListener('input', debouncedUpdatePaceCalculation);
    timeInput.addEventListener('input', debouncedUpdatePaceCalculation);

    // Handle form submission
    form.addEventListener('submit', handleFormSubmit);

    // Initial pace calculation (immediate, no debounce)
    updatePaceCalculation();
}

/**
 * Update the pace calculation display
 */
function updatePaceCalculation() {
    const distanceInput = document.getElementById('run-distance');
    const timeInput = document.getElementById('run-time');
    const paceDisplay = document.getElementById('calculated-pace');

    const distance = parseFloat(distanceInput.value);
    const timeString = timeInput.value.trim();

    // Validate inputs
    if (!distance || distance <= 0 || !timeString) {
        paceDisplay.textContent = '-';
        paceDisplay.style.color = 'var(--text-tertiary)';
        return;
    }

    // Validate time format
    if (!isValidTimeFormat(timeString)) {
        paceDisplay.textContent = 'Invalid time format';
        paceDisplay.style.color = 'var(--danger-color)';
        return;
    }

    // Parse time and calculate pace
    const timeSeconds = parseTime(timeString);

    if (timeSeconds <= 0) {
        paceDisplay.textContent = 'Invalid time';
        paceDisplay.style.color = 'var(--danger-color)';
        return;
    }

    const paceSecondsPerKm = calculatePace(distance, timeSeconds);
    paceDisplay.textContent = formatPace(paceSecondsPerKm);
    paceDisplay.style.color = 'var(--primary-color)';
}

/**
 * Debounced version of updatePaceCalculation
 * Waits for user to stop typing before calculating pace
 */
function debouncedUpdatePaceCalculation() {
    // Clear the previous timeout
    clearTimeout(paceCalculationTimeout);

    // Set a new timeout (300ms delay)
    paceCalculationTimeout = setTimeout(() => {
        updatePaceCalculation();
    }, 300);
}

/**
 * Populate form with existing run data
 * @param {Object} run - Run object to load
 */
function populateFormWithRun(run) {
    document.getElementById('run-date').value = run.date;
    document.getElementById('run-type').value = run.type;
    document.getElementById('run-distance').value = run.distance;
    document.getElementById('run-time').value = formatDuration(run.time);
    document.getElementById('run-notes').value = run.notes || '';
    document.getElementById('gym-session').checked = run.gym || false;
    document.getElementById('bodyweight-session').checked = run.bodyweight || false;
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();

    // Clear any previous messages
    clearMessages();

    // Get form data
    const formData = getFormData();

    // Validate
    const errors = validateFormData(formData);

    if (errors.length > 0) {
        showErrors(errors);
        return;
    }

    // Calculate pace
    const timeSeconds = parseTime(formData.time);
    const pace = calculatePace(formData.distance, timeSeconds);

    // Get current training week
    const settings = getSettings();
    const week = getCurrentWeek(formData.date, settings.trainingPlanStart);
    const phase = getPhaseForWeek(week);

    // Create run object
    const run = {
        date: formData.date,
        type: formData.type,
        distance: formData.distance,
        time: timeSeconds,
        pace: pace,
        notes: formData.notes,
        gym: formData.gym,
        bodyweight: formData.bodyweight,
        week: week,
        phase: phase ? phase.name : 'N/A'
    };

    // Check if we're editing an existing run
    const form = document.getElementById('log-run-form');
    const editingRunId = form.dataset.editingRunId;

    if (editingRunId) {
        run.id = editingRunId; // Include the ID to update existing run
    }

    // Save run
    const success = saveRun(run);

    if (success) {
        const message = editingRunId ? 'Run updated successfully!' : 'Run logged successfully!';
        showSuccess(message);

        // Clear form
        form.reset();
        document.getElementById('run-date').value = getTodayISO();
        document.getElementById('calculated-pace').textContent = '-';
        form.querySelector('button[type="submit"]').textContent = 'Log Run';
        delete form.dataset.editingRunId;

        // If we're on the dashboard, refresh it
        if (window.location.hash === '#dashboard') {
            refreshCurrentPage();
        }
    } else {
        showErrors(['Failed to save run. Please try again.']);
    }
}

/**
 * Get form data as an object
 * @returns {Object} Form data
 */
function getFormData() {
    return {
        date: document.getElementById('run-date').value,
        type: document.getElementById('run-type').value,
        distance: parseFloat(document.getElementById('run-distance').value),
        time: document.getElementById('run-time').value.trim(),
        notes: document.getElementById('run-notes').value.trim(),
        gym: document.getElementById('gym-session').checked,
        bodyweight: document.getElementById('bodyweight-session').checked
    };
}

/**
 * Validate form data
 * @param {Object} formData - Form data to validate
 * @returns {Array} Array of error messages (empty if valid)
 */
function validateFormData(formData) {
    const errors = [];

    // Validate date
    if (!formData.date) {
        errors.push('Date is required');
    } else if (formData.date > getTodayISO()) {
        errors.push('Cannot log runs for future dates');
    }

    // Validate type
    if (!formData.type) {
        errors.push('Run type is required');
    }

    // Validate distance
    if (!formData.distance || formData.distance <= 0) {
        errors.push('Distance must be greater than 0');
    }

    if (formData.distance > 50) {
        errors.push('Distance seems unusually high. Please check.');
    }

    // Validate time
    if (!formData.time) {
        errors.push('Time is required');
    } else if (!isValidTimeFormat(formData.time)) {
        errors.push('Time format is invalid. Use HH:MM:SS or MM:SS');
    } else {
        const timeSeconds = parseTime(formData.time);
        if (timeSeconds <= 0) {
            errors.push('Time must be greater than 0');
        }
        if (timeSeconds > 36000) { // More than 10 hours
            errors.push('Time seems unusually high. Please check.');
        }

        // Check for unrealistic pace
        if (formData.distance > 0 && timeSeconds > 0) {
            const pace = calculatePace(formData.distance, timeSeconds);
            if (pace < 120) { // Faster than 2:00/km
                errors.push('Pace seems unrealistically fast. Please check distance and time.');
            }
            if (pace > 1200) { // Slower than 20:00/km
                errors.push('Pace seems unrealistically slow. Please check distance and time.');
            }
        }
    }

    return errors;
}

/**
 * Show error messages
 * @param {Array} errors - Array of error message strings
 */
function showErrors(errors) {
    const errorContainer = document.getElementById('form-errors');
    errorContainer.innerHTML = errors.map(error =>
        `<div class="error-message">${error}</div>`
    ).join('');
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    const successContainer = document.getElementById('form-success');
    successContainer.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        successContainer.textContent = '';
    }, 5000);
}

/**
 * Clear all messages (errors and success)
 */
function clearMessages() {
    document.getElementById('form-errors').innerHTML = '';
    document.getElementById('form-success').textContent = '';
}
