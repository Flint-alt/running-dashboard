/**
 * settings.js - Settings view
 * Allows users to configure training preferences
 */

import { getSettings, updateSettings } from '../data/storage.js';

/**
 * Initialize settings view
 */
export function initSettings() {
    populateForm();
    setupForm();
}

/**
 * Populate the form with current settings
 */
function populateForm() {
    const settings = getSettings();

    document.getElementById('settings-plan-start').value = settings.trainingPlanStart;
    document.getElementById('settings-goal-weight').value = settings.goalWeight;
    document.getElementById('settings-starting-weight').value = settings.startingWeight;
    document.getElementById('settings-weekly-run-target').value = settings.weeklyRunTarget;
    document.getElementById('settings-weekly-distance-target').value = settings.weeklyDistanceTarget;
    document.getElementById('settings-max-hr').value = settings.maxHeartRate;
}

/**
 * Set up form submission
 */
function setupForm() {
    const form = document.getElementById('settings-form');
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
}

function handleSubmit(event) {
    event.preventDefault();

    const planStart = document.getElementById('settings-plan-start').value;
    const goalWeight = parseFloat(document.getElementById('settings-goal-weight').value);
    const startingWeight = parseFloat(document.getElementById('settings-starting-weight').value);
    const weeklyRunTarget = parseInt(document.getElementById('settings-weekly-run-target').value, 10);
    const weeklyDistanceTarget = parseFloat(document.getElementById('settings-weekly-distance-target').value);
    const maxHeartRate = parseInt(document.getElementById('settings-max-hr').value, 10);

    const errors = [];

    if (!planStart) errors.push('Training plan start date is required.');
    if (isNaN(goalWeight) || goalWeight < 30 || goalWeight > 300) errors.push('Goal weight must be between 30 and 300 kg.');
    if (isNaN(startingWeight) || startingWeight < 30 || startingWeight > 300) errors.push('Starting weight must be between 30 and 300 kg.');
    if (isNaN(weeklyRunTarget) || weeklyRunTarget < 1 || weeklyRunTarget > 14) errors.push('Weekly run target must be between 1 and 14.');
    if (isNaN(weeklyDistanceTarget) || weeklyDistanceTarget < 0) errors.push('Weekly distance target must be 0 or greater.');
    if (isNaN(maxHeartRate) || maxHeartRate < 100 || maxHeartRate > 250) errors.push('Max heart rate must be between 100 and 250 bpm.');

    const errorsEl = document.getElementById('settings-errors');
    const successEl = document.getElementById('settings-success');

    if (errors.length > 0) {
        errorsEl.innerHTML = errors.map(e => `<div class="error-message">${e}</div>`).join('');
        successEl.textContent = '';
        return;
    }

    errorsEl.innerHTML = '';

    updateSettings({ trainingPlanStart: planStart, goalWeight, startingWeight, weeklyRunTarget, weeklyDistanceTarget, maxHeartRate });

    successEl.textContent = 'Settings saved!';
    setTimeout(() => { successEl.textContent = ''; }, 4000);
}
