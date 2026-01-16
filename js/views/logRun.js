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
    const screenshotInput = document.getElementById('strava-screenshot');

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
    screenshotInput.removeEventListener('change', handleScreenshotUpload);

    // Calculate pace when distance or time changes (debounced for performance)
    distanceInput.addEventListener('input', debouncedUpdatePaceCalculation);
    timeInput.addEventListener('input', debouncedUpdatePaceCalculation);

    // Handle screenshot upload
    screenshotInput.addEventListener('change', handleScreenshotUpload);

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
    document.getElementById('run-heart-rate').value = run.heartRate || '';
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
        heartRate: formData.heartRate || null,
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
    const result = saveRun(run);

    if (result.success) {
        const message = editingRunId ? 'Run updated successfully!' : 'Run logged successfully!';
        showSuccess(message);

        // Clear form
        form.reset();
        document.getElementById('run-date').value = getTodayISO();
        document.getElementById('calculated-pace').textContent = '-';
        form.querySelector('button[type="submit"]').textContent = 'Log Run';
        delete form.dataset.editingRunId;

        // Show milestone modal if a new milestone was achieved
        if (result.milestone) {
            showMilestoneModal(result.milestone);
        }

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
    const heartRateValue = document.getElementById('run-heart-rate').value;
    return {
        date: document.getElementById('run-date').value,
        type: document.getElementById('run-type').value,
        distance: parseFloat(document.getElementById('run-distance').value),
        time: document.getElementById('run-time').value.trim(),
        heartRate: heartRateValue ? parseInt(heartRateValue) : null,
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
            // Allow 2:30/km (150s) for interval work, up to 15:00/km (900s) for recovery/walking
            if (pace < 150) { // Faster than 2:30/km - elite interval pace
                errors.push('Pace seems unrealistically fast (< 2:30/km). Please check distance and time.');
            }
            if (pace > 900) { // Slower than 15:00/km - very slow walking pace
                errors.push('Pace seems unrealistically slow (> 15:00/km). Please check distance and time.');
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

/**
 * Show milestone celebration modal
 * @param {string} milestoneName - Name of the milestone achieved
 */
function showMilestoneModal(milestoneName) {
    const overlay = document.getElementById('milestone-modal-overlay');
    const title = document.getElementById('milestone-modal-title');
    const message = document.getElementById('milestone-modal-message');
    const closeBtn = document.getElementById('milestone-modal-close');

    // Set the content
    title.textContent = `${milestoneName} Complete!`;

    let messageText = '';
    if (milestoneName === 'First 10K') {
        messageText = 'You just ran your first 10 kilometers! This is a huge milestone in your running journey. Keep up the amazing work!';
    } else if (milestoneName === 'First 15K') {
        messageText = 'Incredible! You\'ve reached 15 kilometers! You\'re getting stronger with every run. The half marathon is within reach!';
    } else if (milestoneName === 'First 20K') {
        messageText = 'Outstanding! 20 kilometers is an amazing achievement! You\'re so close to the half marathon distance now!';
    } else if (milestoneName === 'Half Marathon') {
        messageText = 'Congratulations! You\'ve completed a half marathon distance (21.1km)! This is an incredible achievement that few runners accomplish. You should be incredibly proud!';
    }

    message.textContent = messageText;

    // Show the modal
    overlay.style.display = 'flex';

    // Set up close handler
    const closeModal = () => {
        overlay.style.display = 'none';
        closeBtn.removeEventListener('click', closeModal);
        overlay.removeEventListener('click', handleOverlayClick);
    };

    const handleOverlayClick = (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', handleOverlayClick);
}

/**
 * Handle screenshot upload and OCR processing
 * @param {Event} event - File input change event
 */
async function handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusDiv = document.getElementById('ocr-status');
    const previewDiv = document.getElementById('screenshot-preview');

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: var(--radius-md);" alt="Screenshot preview">`;
    };
    reader.readAsDataURL(file);

    // Show processing status
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'var(--info-bg)';
    statusDiv.style.color = 'var(--info-color)';
    statusDiv.textContent = '🔄 Analyzing screenshot... This may take 5-10 seconds...';

    try {
        // Run OCR using Tesseract.js
        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    statusDiv.textContent = `🔄 Analyzing screenshot... ${progress}%`;
                }
            }
        });

        const text = result.data.text;
        console.log('OCR Result:', text);

        // Parse the extracted text
        const extractedData = parseStravaScreenshot(text);

        if (extractedData.found) {
            // Auto-populate form
            if (extractedData.distance) {
                document.getElementById('run-distance').value = extractedData.distance;
            }
            if (extractedData.time) {
                document.getElementById('run-time').value = extractedData.time;
            }
            if (extractedData.heartRate) {
                document.getElementById('run-heart-rate').value = extractedData.heartRate;
            }

            // Trigger pace calculation
            updatePaceCalculation();

            // Show success
            statusDiv.style.background = 'var(--success-bg)';
            statusDiv.style.color = 'var(--success-color)';
            statusDiv.textContent = '✅ Data extracted successfully! Please review and adjust if needed.';
        } else {
            // No data found
            statusDiv.style.background = 'var(--warning-bg)';
            statusDiv.style.color = 'var(--warning-color)';
            statusDiv.textContent = '⚠️ Could not extract run data from screenshot. Please enter manually.';
        }
    } catch (error) {
        console.error('OCR Error:', error);
        statusDiv.style.background = 'var(--danger-bg)';
        statusDiv.style.color = 'var(--danger-color)';
        statusDiv.textContent = '❌ Failed to process screenshot. Please enter data manually.';
    }
}

/**
 * Parse Strava screenshot text to extract run data
 * @param {string} text - OCR extracted text
 * @returns {Object} Extracted data
 */
function parseStravaScreenshot(text) {
    const data = {
        distance: null,
        time: null,
        heartRate: null,
        found: false
    };

    // Clean up text
    text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // Extract distance (km or miles)
    // Patterns: "5.0 km", "5.00km", "3.1 mi", "3.11miles"
    const distancePattern = /(\d+\.?\d*)\s*(km|mi|miles?)/gi;
    const distanceMatch = text.match(distancePattern);
    if (distanceMatch) {
        const match = distanceMatch[0];
        const value = parseFloat(match);
        // Convert miles to km if needed
        if (match.toLowerCase().includes('mi')) {
            data.distance = (value * 1.60934).toFixed(2);
        } else {
            data.distance = value.toFixed(2);
        }
        data.found = true;
    }

    // Extract time (various formats)
    // Patterns: "30:45", "1:30:45", "30m 45s", "1h 30m 45s"
    const timePatterns = [
        /(\d{1,2}):(\d{2}):(\d{2})/,  // HH:MM:SS or H:MM:SS
        /(\d{1,2}):(\d{2})/,           // MM:SS or M:SS
        /(\d+)h\s*(\d+)m\s*(\d+)s/i,  // 1h 30m 45s
        /(\d+)m\s*(\d+)s/i             // 30m 45s
    ];

    for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
            if (pattern.source.includes('h')) {
                // Hour format
                const hours = parseInt(match[1] || 0);
                const minutes = parseInt(match[2] || 0);
                const seconds = parseInt(match[3] || 0);
                data.time = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else if (match[3]) {
                // HH:MM:SS
                data.time = `${match[1]}:${match[2]}:${match[3]}`;
            } else {
                // MM:SS
                data.time = `${match[1]}:${match[2]}`;
            }
            data.found = true;
            break;
        }
    }

    // Extract heart rate (average)
    // Patterns: "155 bpm", "155bpm", "avg 155", "average 155"
    const hrPatterns = [
        /(\d{2,3})\s*bpm/i,
        /avg\s*(\d{2,3})/i,
        /average\s*(\d{2,3})/i,
        /heart rate\s*(\d{2,3})/i
    ];

    for (const pattern of hrPatterns) {
        const match = text.match(pattern);
        if (match) {
            const hr = parseInt(match[1]);
            // Validate heart rate is reasonable (40-220 bpm)
            if (hr >= 40 && hr <= 220) {
                data.heartRate = hr;
                data.found = true;
                break;
            }
        }
    }

    return data;
}
