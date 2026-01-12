/**
 * weight.js - Weight tracking view
 * Log and visualize weight progress toward goal
 */

import { getWeights, saveWeight, getSettings } from '../data/storage.js';
import { getTodayISO, formatDate } from '../utils/date.js';

// Chart instance
let weightChart = null;

/**
 * Initialize weight tracking view
 */
export function initWeight() {
    // Clear any previous messages
    clearMessages();

    setupForm();
    renderWeightChart();
}

/**
 * Set up weight entry form
 */
function setupForm() {
    const form = document.getElementById('log-weight-form');
    const dateInput = document.getElementById('weight-date');

    // Set default date to today only if field is empty (preserve user's selection)
    if (!dateInput.value) {
        dateInput.value = getTodayISO();
    }

    // Remove old event listener to prevent memory leaks
    form.removeEventListener('submit', handleWeightSubmit);

    // Handle form submission
    form.addEventListener('submit', handleWeightSubmit);
}

/**
 * Handle weight form submission
 * @param {Event} event - Form submit event
 */
function handleWeightSubmit(event) {
    event.preventDefault();

    // Clear any previous messages
    clearMessages();

    const dateInput = document.getElementById('weight-date');
    const weightInput = document.getElementById('weight-value');
    const noteInput = document.getElementById('weight-note');

    const weight = {
        date: dateInput.value,
        weight: parseFloat(weightInput.value),
        note: noteInput.value.trim()
    };

    // Validate
    const errors = validateWeightData(weight);
    if (errors.length > 0) {
        showErrors(errors);
        return;
    }

    // Check if there's already an entry for this date
    const weights = getWeights();
    const existingEntry = weights.find(w => w.date === weight.date);

    // Save
    const success = saveWeight(weight);

    if (success) {
        // Clear form
        weightInput.value = '';
        noteInput.value = '';
        dateInput.value = getTodayISO();

        // Re-render chart
        renderWeightChart();

        // Show appropriate message
        if (existingEntry) {
            showSuccess('Weight entry updated for ' + weight.date);
        } else {
            showSuccess('Weight logged successfully!');
        }
    } else {
        showErrors(['Failed to save weight entry. Please try again.']);
    }
}

/**
 * Render weight trend chart
 */
function renderWeightChart() {
    const canvas = document.getElementById('weight-chart');
    const emptyStateId = 'weight-chart-empty-state';
    const emptyStateMessage = 'No weight data yet. Log your first weight entry above!';

    if (!canvas) {
        console.warn('Weight chart canvas not found.');
        return;
    }

    const chartContainer = canvas.parentElement;

    const showEmptyState = (message) => {
        let emptyState = chartContainer.querySelector(`#${emptyStateId}`);

        if (!emptyState) {
            emptyState = document.createElement('p');
            emptyState.id = emptyStateId;
            emptyState.className = 'empty-state';
            chartContainer.appendChild(emptyState);
        }

        emptyState.textContent = message;
        canvas.style.display = 'none';
    };

    const clearEmptyState = () => {
        const emptyState = chartContainer.querySelector(`#${emptyStateId}`);
        if (emptyState) {
            emptyState.remove();
        }
        canvas.style.display = '';
    };

    clearEmptyState();

    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (weightChart) {
        weightChart.destroy();
    }

    const weights = getWeights().reverse(); // Oldest first for chart
    const settings = getSettings();

    if (weights.length === 0) {
        showEmptyState(emptyStateMessage);
        return;
    }

    // Prepare data
    const labels = weights.map(w => formatDate(w.date, 'short'));
    const weightData = weights.map(w => w.weight);
    const goalData = weights.map(() => settings.goalWeight);

    // Calculate 7-day moving average (if enough data)
    const movingAvg = calculateMovingAverage(weightData, 7);

    // Create chart
    if (typeof Chart !== 'undefined') {
        const datasets = [
            {
                label: 'Weight',
                data: weightData,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            },
            {
                label: 'Goal',
                data: goalData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                tension: 0
            }
        ];

        // Add moving average if we have enough data
        if (movingAvg.length > 0) {
            datasets.push({
                label: '7-Day Avg',
                data: movingAvg,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3
            });
        }

        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Weight (kg)'
                        },
                        min: Math.min(settings.goalWeight - 2, ...weightData) - 1,
                        max: Math.max(settings.startingWeight + 2, ...weightData) + 1
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    } else {
        showEmptyState('Chart.js not loaded. Please refresh the page.');
    }
}

/**
 * Calculate moving average
 * @param {Array} data - Array of numbers
 * @param {number} window - Window size for moving average
 * @returns {Array} Moving average values
 */
function calculateMovingAverage(data, window) {
    if (data.length < window) return [];

    const result = [];

    for (let i = 0; i < data.length; i++) {
        if (i < window - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / window);
        }
    }

    return result;
}

/**
 * Validate weight data
 * @param {Object} weight - Weight data to validate
 * @returns {Array} Array of error messages (empty if valid)
 */
function validateWeightData(weight) {
    const errors = [];

    // Validate date
    if (!weight.date) {
        errors.push('Date is required');
    } else if (weight.date > getTodayISO()) {
        errors.push('Cannot log weight for future dates');
    }

    // Validate weight
    if (!weight.weight || weight.weight <= 0) {
        errors.push('Weight must be greater than 0');
    }

    if (weight.weight < 40 || weight.weight > 150) {
        errors.push('Weight must be between 40 and 150 kg');
    }

    return errors;
}

/**
 * Show error messages
 * @param {Array} errors - Array of error message strings
 */
function showErrors(errors) {
    const errorContainer = document.getElementById('weight-form-errors');
    errorContainer.innerHTML = errors.map(error =>
        `<div class="error-message">${error}</div>`
    ).join('');
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    const successContainer = document.getElementById('weight-form-success');
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
    document.getElementById('weight-form-errors').innerHTML = '';
    document.getElementById('weight-form-success').textContent = '';
}
