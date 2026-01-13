/**
 * dashboard.js - Main dashboard view
 * Displays training overview, recent runs, and progress summary
 */

import { getRuns, getRunsForWeek, getRun, deleteRun, getSettings, getCurrentWeight, getWeightLost, getWeightProgress, exportData, importData } from '../data/storage.js';
import { getTodayISO, getCurrentWeek, formatDate, formatDateRange } from '../utils/date.js';
import { formatPace, formatDuration, formatDistance } from '../utils/pace.js';
import { getWeekPlan, getNextMilestone } from '../data/trainingPlan.js';

/**
 * Initialize dashboard on app load
 */
export function initDashboard() {
    updateDashboard();
    setupDataManagement();
    setupRecentRunsEventDelegation();
}

/**
 * Update dashboard with current data
 * Called when navigating to dashboard or after data changes
 */
export function updateDashboard() {
    updateCurrentWeek();
    updateWeightProgress();
    updateNextMilestone();
    updateWeekSummary();
    updateRecentRuns();
}

/**
 * Update current week info card
 */
function updateCurrentWeek() {
    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    const weekNumEl = document.getElementById('week-num');
    const weekDatesEl = document.getElementById('week-dates');
    const phaseBadgeEl = document.getElementById('phase-badge');
    const plannedParkrunEl = document.getElementById('planned-parkrun');
    const plannedLongRunEl = document.getElementById('planned-long-run');

    // Handle case where we're before plan starts or after plan ends
    if (currentWeek < 1) {
        weekNumEl.textContent = 'Not Started';
        weekDatesEl.textContent = 'Training begins Jan 5, 2026';
        phaseBadgeEl.textContent = 'Upcoming';
        phaseBadgeEl.className = 'phase-badge';
        plannedParkrunEl.textContent = '-';
        plannedLongRunEl.textContent = '-';
        return;
    }

    if (currentWeek > 44) {
        weekNumEl.textContent = 'Complete!';
        weekDatesEl.textContent = 'Training plan finished';
        phaseBadgeEl.textContent = 'Done';
        phaseBadgeEl.className = 'phase-badge';
        plannedParkrunEl.textContent = '-';
        plannedLongRunEl.textContent = '-';
        return;
    }

    // Get week plan
    const weekPlan = getWeekPlan(currentWeek);

    weekNumEl.textContent = currentWeek;
    weekDatesEl.textContent = weekPlan.dateRange.formatted;

    // Set phase badge
    phaseBadgeEl.textContent = `Phase ${weekPlan.phase.id}`;
    phaseBadgeEl.className = `phase-badge phase-${weekPlan.phase.id}`;

    // Show planned runs
    plannedParkrunEl.textContent = `${weekPlan.parkrun} km`;
    plannedLongRunEl.textContent = `${weekPlan.longRun} km`;

    // Remove any existing recovery badge first to prevent duplicates
    const existingRecoveryBadge = phaseBadgeEl.parentElement.querySelector('.badge-recovery');
    if (existingRecoveryBadge) {
        existingRecoveryBadge.remove();
    }

    // Add recovery badge if it's a recovery week
    if (weekPlan.isRecovery) {
        const recoveryBadge = document.createElement('span');
        recoveryBadge.className = 'badge badge-recovery';
        recoveryBadge.textContent = 'Recovery Week';
        recoveryBadge.style.marginLeft = 'var(--spacing-sm)';
        phaseBadgeEl.after(recoveryBadge);
    }
}

/**
 * Update weight progress card
 */
function updateWeightProgress() {
    const currentWeight = getCurrentWeight();
    const weightLost = getWeightLost();
    const progress = getWeightProgress();

    document.getElementById('current-weight').textContent = `${currentWeight.toFixed(1)} kg`;
    document.getElementById('weight-lost').textContent = `${weightLost.toFixed(1)} kg`;

    const progressBar = document.getElementById('weight-progress');
    progressBar.style.width = `${progress}%`;
}

/**
 * Update next milestone card
 */
function updateNextMilestone() {
    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    const nextMilestone = getNextMilestone(currentWeek);

    const milestoneNameEl = document.getElementById('milestone-name');
    const milestoneDistanceEl = document.getElementById('milestone-distance');
    const milestoneWeekEl = document.getElementById('milestone-week');
    const milestoneCountdownEl = document.getElementById('milestone-countdown');

    if (!nextMilestone || currentWeek > 44) {
        milestoneNameEl.textContent = 'All Done!';
        milestoneDistanceEl.textContent = '🎉';
        milestoneWeekEl.textContent = 'Completed';
        milestoneCountdownEl.textContent = 'Congratulations on finishing your training!';
        return;
    }

    milestoneNameEl.textContent = nextMilestone.name;
    milestoneDistanceEl.textContent = `${nextMilestone.distance} km`;
    milestoneWeekEl.textContent = `Week ${nextMilestone.week}`;

    const weeksUntil = nextMilestone.week - currentWeek;
    if (weeksUntil === 0) {
        milestoneCountdownEl.textContent = 'This week!';
    } else if (weeksUntil === 1) {
        milestoneCountdownEl.textContent = 'Next week!';
    } else {
        milestoneCountdownEl.textContent = `${weeksUntil} weeks to go`;
    }
}

/**
 * Update this week's summary
 */
function updateWeekSummary() {
    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    const runs = getRunsForWeek(currentWeek);

    // Calculate totals
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const runCount = runs.length;

    // Count gym and bodyweight sessions
    const gymSessions = runs.filter(run => run.gym).length;
    const bodyweightSessions = runs.filter(run => run.bodyweight).length;

    // Update display
    document.getElementById('week-distance').textContent = `${totalDistance.toFixed(1)} km`;
    document.getElementById('week-runs').textContent = runCount;
    document.getElementById('week-gym').textContent = gymSessions > 0 ? `✓ (${gymSessions})` : '-';
    document.getElementById('week-bodyweight').textContent = bodyweightSessions > 0 ? `✓ (${bodyweightSessions})` : '-';
}

/**
 * Update recent runs list
 */
function updateRecentRuns() {
    const runs = getRuns().slice(0, 5); // Get 5 most recent
    const container = document.getElementById('recent-runs');

    if (runs.length === 0) {
        container.replaceChildren();
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No runs logged yet. ';
        const emptyStateLink = document.createElement('a');
        emptyStateLink.href = '#log-run';
        emptyStateLink.textContent = 'Log your first run!';
        emptyState.appendChild(emptyStateLink);
        container.appendChild(emptyState);
        return;
    }

    container.replaceChildren(...runs.map(run => createRunCard(run)));
    // Event listeners now handled by event delegation in setupRecentRunsEventDelegation()
}

/**
 * Set up event delegation for recent runs edit/delete buttons
 * Uses a single listener on the container instead of individual listeners per button
 */
function setupRecentRunsEventDelegation() {
    const container = document.getElementById('recent-runs');

    // Remove any existing listener to prevent duplicates
    container.removeEventListener('click', handleRecentRunsClick);

    // Add single delegated listener
    container.addEventListener('click', handleRecentRunsClick);
}

/**
 * Handle clicks on recent runs container (event delegation)
 * @param {Event} event - Click event
 */
function handleRecentRunsClick(event) {
    const target = event.target;

    // Check if edit button was clicked
    if (target.classList.contains('btn-edit-run')) {
        handleEditRun(event);
    }

    // Check if delete button was clicked
    if (target.classList.contains('btn-delete-run')) {
        handleDeleteRun(event);
    }
}

/**
 * Create HTML for a run card
 * @param {Object} run - Run object
 * @returns {HTMLElement} Run card element
 */
function createRunCard(run) {
    const runTypeColors = {
        parkrun: '#2563eb',
        long: '#ec4899',
        easy: '#10b981',
        tempo: '#f59e0b',
        intervals: '#ef4444',
        recovery: '#8b5cf6'
    };
    const allowedRunTypes = new Set(Object.keys(runTypeColors));
    const normalizedRunType = allowedRunTypes.has(run.type) ? run.type : 'unknown';

    const typeColor = runTypeColors[normalizedRunType] || '#6b7280';

    const runItem = document.createElement('div');
    runItem.className = 'run-item';
    runItem.dataset.runId = run.id;

    const runItemMain = document.createElement('div');
    runItemMain.className = 'run-item-main';

    const runItemHeader = document.createElement('div');
    runItemHeader.className = 'run-item-header';

    const runTypeBadge = document.createElement('span');
    runTypeBadge.classList.add('run-type-badge');
    if (normalizedRunType !== 'unknown') {
        runTypeBadge.classList.add(normalizedRunType);
    }
    runTypeBadge.style.backgroundColor = `${typeColor}20`;
    runTypeBadge.style.color = typeColor;
    runTypeBadge.textContent = run.type;

    const runDate = document.createElement('span');
    runDate.className = 'run-date';
    runDate.textContent = formatDate(run.date);

    runItemHeader.appendChild(runTypeBadge);
    runItemHeader.appendChild(runDate);

    const runStats = document.createElement('div');
    runStats.className = 'run-stats';

    const distanceStat = document.createElement('div');
    distanceStat.className = 'run-stat';
    const distanceLabel = document.createElement('span');
    distanceLabel.className = 'run-stat-label';
    distanceLabel.textContent = 'Distance';
    const distanceValue = document.createElement('span');
    distanceValue.className = 'run-stat-value';
    distanceValue.textContent = `${run.distance.toFixed(2)} km`;
    distanceStat.appendChild(distanceLabel);
    distanceStat.appendChild(distanceValue);

    const timeStat = document.createElement('div');
    timeStat.className = 'run-stat';
    const timeLabel = document.createElement('span');
    timeLabel.className = 'run-stat-label';
    timeLabel.textContent = 'Time';
    const timeValue = document.createElement('span');
    timeValue.className = 'run-stat-value';
    timeValue.textContent = formatDuration(run.time);
    timeStat.appendChild(timeLabel);
    timeStat.appendChild(timeValue);

    const paceStat = document.createElement('div');
    paceStat.className = 'run-stat';
    const paceLabel = document.createElement('span');
    paceLabel.className = 'run-stat-label';
    paceLabel.textContent = 'Pace';
    const paceValue = document.createElement('span');
    paceValue.className = 'run-stat-value';
    paceValue.textContent = formatPace(run.pace);
    paceStat.appendChild(paceLabel);
    paceStat.appendChild(paceValue);

    runStats.appendChild(distanceStat);
    runStats.appendChild(timeStat);
    runStats.appendChild(paceStat);

    runItemMain.appendChild(runItemHeader);
    runItemMain.appendChild(runStats);

    if (run.notes) {
        const runNotes = document.createElement('div');
        runNotes.className = 'run-notes';
        runNotes.style.marginTop = 'var(--spacing-sm)';
        runNotes.style.color = 'var(--text-secondary)';
        runNotes.style.fontSize = 'var(--font-size-sm)';
        runNotes.textContent = run.notes;
        runItemMain.appendChild(runNotes);
    }

    if (run.gym || run.bodyweight) {
        const accessories = document.createElement('div');
        accessories.style.marginTop = 'var(--spacing-sm)';
        accessories.style.fontSize = 'var(--font-size-sm)';
        accessories.style.color = 'var(--text-secondary)';

        if (run.gym) {
            const gymSpan = document.createElement('span');
            gymSpan.style.marginRight = 'var(--spacing-sm)';
            gymSpan.textContent = '💪 Gym';
            accessories.appendChild(gymSpan);
        }

        if (run.bodyweight) {
            const bodyweightSpan = document.createElement('span');
            bodyweightSpan.textContent = '🏋️ Bodyweight';
            accessories.appendChild(bodyweightSpan);
        }

        runItemMain.appendChild(accessories);
    }

    const runItemActions = document.createElement('div');
    runItemActions.className = 'run-item-actions';
    runItemActions.style.marginTop = 'var(--spacing-sm)';
    runItemActions.style.display = 'flex';
    runItemActions.style.gap = 'var(--spacing-sm)';

    const editButton = document.createElement('button');
    editButton.className = 'btn-edit-run';
    editButton.dataset.runId = run.id;
    editButton.style.flex = '1';
    editButton.style.padding = 'var(--spacing-sm)';
    editButton.style.border = '1px solid var(--border-color)';
    editButton.style.background = 'white';
    editButton.style.borderRadius = 'var(--radius-sm)';
    editButton.style.cursor = 'pointer';
    editButton.style.fontSize = 'var(--font-size-sm)';
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete-run';
    deleteButton.dataset.runId = run.id;
    deleteButton.style.flex = '1';
    deleteButton.style.padding = 'var(--spacing-sm)';
    deleteButton.style.border = '1px solid var(--danger-color)';
    deleteButton.style.background = 'white';
    deleteButton.style.color = 'var(--danger-color)';
    deleteButton.style.borderRadius = 'var(--radius-sm)';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.fontSize = 'var(--font-size-sm)';
    deleteButton.textContent = 'Delete';

    runItemActions.appendChild(editButton);
    runItemActions.appendChild(deleteButton);

    runItem.appendChild(runItemMain);
    runItem.appendChild(runItemActions);

    return runItem;
}

/**
 * Handle edit run button click
 * @param {Event} event - Click event
 */
function handleEditRun(event) {
    const runId = event.target.dataset.runId;
    const run = getRun(runId);

    if (!run) {
        alert('Run not found');
        return;
    }

    // Store the run ID in localStorage for the log-run form to pick up
    localStorage.setItem('editingRunId', runId);

    // Navigate to log-run page
    window.location.hash = 'log-run';
}

/**
 * Handle delete run button click
 * @param {Event} event - Click event
 */
function handleDeleteRun(event) {
    const runId = event.target.dataset.runId;
    const run = getRun(runId);

    if (!run) {
        alert('Run not found');
        return;
    }

    // Confirm deletion
    const confirmed = confirm(
        `Are you sure you want to delete this run?\n\n` +
        `Date: ${formatDate(run.date)}\n` +
        `Distance: ${run.distance.toFixed(2)} km\n` +
        `Time: ${formatDuration(run.time)}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    // Delete the run
    const success = deleteRun(runId);

    if (success) {
        // Refresh the dashboard
        updateDashboard();
    } else {
        alert('Failed to delete run. Please try again.');
    }
}

/**
 * Set up data management (export/import) functionality
 */
function setupDataManagement() {
    const exportButton = document.getElementById('btn-export-data');
    const importButton = document.getElementById('btn-import-data');
    const fileInput = document.getElementById('import-file-input');

    // Remove old listeners to prevent memory leaks
    exportButton.removeEventListener('click', handleExportData);
    importButton.removeEventListener('click', handleImportButtonClick);
    fileInput.removeEventListener('change', handleFileSelected);

    // Add event listeners
    exportButton.addEventListener('click', handleExportData);
    importButton.addEventListener('click', handleImportButtonClick);
    fileInput.addEventListener('change', handleFileSelected);
}

/**
 * Handle export data button click
 */
function handleExportData() {
    try {
        // Get the data as JSON string
        const jsonData = exportData();

        // Create a blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `running-dashboard-backup-${getTodayISO()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        showImportStatus('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showImportStatus('Failed to export data. Please try again.', 'error');
    }
}

/**
 * Handle import button click (trigger file picker)
 */
function handleImportButtonClick() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
}

/**
 * Handle file selected for import
 * @param {Event} event - Change event
 */
function handleFileSelected(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // Confirm before importing
    const confirmed = confirm(
        'Importing data will REPLACE all your current data.\n\n' +
        'Make sure you have exported your current data first!\n\n' +
        'Do you want to continue?'
    );

    if (!confirmed) {
        // Reset file input
        event.target.value = '';
        return;
    }

    // Read the file
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const jsonString = e.target.result;
            const success = importData(jsonString);

            if (success) {
                showImportStatus('Data imported successfully! Refreshing...', 'success');

                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showImportStatus('Failed to import data. Invalid file format.', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showImportStatus('Failed to import data. Please check the file.', 'error');
        }

        // Reset file input
        event.target.value = '';
    };

    reader.onerror = () => {
        showImportStatus('Failed to read file. Please try again.', 'error');
        event.target.value = '';
    };

    reader.readAsText(file);
}

/**
 * Show import/export status message
 * @param {string} message - Status message
 * @param {string} type - 'success' or 'error'
 */
function showImportStatus(message, type) {
    const statusEl = document.getElementById('import-status');
    statusEl.textContent = message;
    statusEl.style.color = type === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.textContent = '';
    }, 5000);
}
