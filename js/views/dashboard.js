/**
 * dashboard.js - Main dashboard view
 * Displays training overview, recent runs, and progress summary
 */

import { getRuns, getRunsForWeek, getRun, deleteRun, getSettings, getCurrentWeight, getWeightLost, getWeightProgress, exportData, importData, getRecords, getRunStreak, exportRunsAsCSV } from '../data/storage.js';
import { getTodayISO, getCurrentWeek, formatDate, formatDateRange } from '../utils/date.js';
import { formatPace, formatDuration, formatDistance } from '../utils/pace.js';
import { getWeekPlan, getNextMilestone } from '../data/trainingPlan.js';

// Current run type filter
let currentRunTypeFilter = 'all';

/**
 * Initialize dashboard on app load
 */
export function initDashboard() {
    updateDashboard();
    setupDataManagement();
    setupRecentRunsEventDelegation();
    setupRunTypeFilter();
}

/**
 * Update dashboard with current data
 * Called when navigating to dashboard or after data changes
 */
export function updateDashboard() {
    updateCurrentWeek();
    updateWeightProgress();
    updateRunStreak();
    updateNextMilestone();
    updateRaceCountdown();
    updateWeekSummary();
    updatePersonalRecords();
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
 * Update run streak display
 */
function updateRunStreak() {
    const streak = getRunStreak();

    const currentEl = document.getElementById('streak-current');
    const longestEl = document.getElementById('streak-longest');

    currentEl.textContent = streak.current;

    if (streak.longest === 1) {
        longestEl.textContent = '1 week';
    } else {
        longestEl.textContent = `${streak.longest} weeks`;
    }

    // Add motivational message for streaks
    if (streak.current >= 12) {
        currentEl.parentElement.querySelector('.streak-current > div:first-child').textContent = 'Amazing Streak! 🔥';
    } else if (streak.current >= 4) {
        currentEl.parentElement.querySelector('.streak-current > div:first-child').textContent = 'Great Streak! 🔥';
    } else {
        currentEl.parentElement.querySelector('.streak-current > div:first-child').textContent = 'Current Streak';
    }
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
 * Update race day countdown
 */
function updateRaceCountdown() {
    const today = new Date(getTodayISO());
    const raceDay = new Date('2026-11-08'); // Nov 8, 2026

    const diffTime = raceDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    const countdownDaysEl = document.getElementById('race-countdown-days');

    if (diffDays < 0) {
        countdownDaysEl.textContent = 'Race Complete! 🎉';
    } else if (diffDays === 0) {
        countdownDaysEl.textContent = 'Today! 🏃‍♂️';
    } else if (diffDays === 1) {
        countdownDaysEl.textContent = 'Tomorrow!';
    } else if (diffDays < 7) {
        countdownDaysEl.textContent = `${diffDays} days`;
    } else if (diffWeeks === 1) {
        countdownDaysEl.textContent = '1 week';
    } else {
        const remainingDays = diffDays % 7;
        if (remainingDays === 0) {
            countdownDaysEl.textContent = `${diffWeeks} weeks`;
        } else {
            countdownDaysEl.textContent = `${diffWeeks} weeks, ${remainingDays} days`;
        }
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

    // Update weekly progress indicator
    // Target is 2 runs per week (parkrun + long run minimum)
    const targetRuns = 2;
    const completedRuns = Math.min(runCount, targetRuns);
    const progressPercentage = (completedRuns / targetRuns) * 100;

    const progressText = document.getElementById('week-progress-text');
    const progressBar = document.getElementById('week-progress-bar');

    progressText.textContent = `${completedRuns}/${targetRuns} runs`;
    progressBar.style.width = `${progressPercentage}%`;

    // Change color if target is met
    if (completedRuns >= targetRuns) {
        progressText.style.color = '#15803d';
        progressBar.style.background = 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)';
    } else {
        progressText.style.color = '#166534';
        progressBar.style.background = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
    }

    // Update display
    document.getElementById('week-distance').textContent = `${totalDistance.toFixed(1)} km`;
    document.getElementById('week-runs').textContent = runCount;
    document.getElementById('week-gym').textContent = gymSessions > 0 ? `✓ (${gymSessions})` : '-';
    document.getElementById('week-bodyweight').textContent = bodyweightSessions > 0 ? `✓ (${bodyweightSessions})` : '-';
}

/**
 * Update personal records display
 */
function updatePersonalRecords() {
    const records = getRecords();
    const container = document.getElementById('personal-records');

    if (!records.longestRun) {
        container.innerHTML = '<p class="empty-state">No runs logged yet.</p>';
        return;
    }

    const recordsHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
            ${records.fastest5k ? `
                <div class="pr-item" style="padding: var(--spacing-md); background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: var(--radius-md); border: 2px solid #f59e0b;">
                    <div style="font-size: var(--font-size-sm); color: #92400e; font-weight: 600; margin-bottom: var(--spacing-xs);">Fastest 5K</div>
                    <div style="font-size: var(--font-size-lg); font-weight: 700; color: #78350f; margin-bottom: var(--spacing-xs);">
                        ${formatDuration((records.fastest5k.time / records.fastest5k.distance) * 5)}
                    </div>
                    <div style="font-size: var(--font-size-sm); color: #92400e);">
                        ${formatDate(records.fastest5k.date, 'short')}
                    </div>
                </div>
            ` : ''}
            ${records.fastest10k ? `
                <div class="pr-item" style="padding: var(--spacing-md); background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: var(--radius-md); border: 2px solid #f59e0b;">
                    <div style="font-size: var(--font-size-sm); color: #92400e; font-weight: 600; margin-bottom: var(--spacing-xs);">Fastest 10K</div>
                    <div style="font-size: var(--font-size-lg); font-weight: 700; color: #78350f; margin-bottom: var(--spacing-xs);">
                        ${formatDuration((records.fastest10k.time / records.fastest10k.distance) * 10)}
                    </div>
                    <div style="font-size: var(--font-size-sm); color: #92400e);">
                        ${formatDate(records.fastest10k.date, 'short')}
                    </div>
                </div>
            ` : ''}
            <div class="pr-item" style="padding: var(--spacing-md); background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: var(--radius-md); border: 2px solid #3b82f6;">
                <div style="font-size: var(--font-size-sm); color: #1e3a8a; font-weight: 600; margin-bottom: var(--spacing-xs);">Longest Run</div>
                <div style="font-size: var(--font-size-lg); font-weight: 700; color: #1e40af; margin-bottom: var(--spacing-xs);">
                    ${records.longestRun.distance.toFixed(2)} km
                </div>
                <div style="font-size: var(--font-size-sm); color: #1e3a8a);">
                    ${formatDate(records.longestRun.date, 'short')}
                </div>
            </div>
            <div class="pr-item" style="padding: var(--spacing-md); background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: var(--radius-md); border: 2px solid #22c55e;">
                <div style="font-size: var(--font-size-sm); color: #14532d; font-weight: 600; margin-bottom: var(--spacing-xs);">Best Pace</div>
                <div style="font-size: var(--font-size-lg); font-weight: 700; color: #15803d; margin-bottom: var(--spacing-xs);">
                    ${formatPace(records.bestPace.pace)}
                </div>
                <div style="font-size: var(--font-size-sm); color: #14532d);">
                    ${formatDate(records.bestPace.date, 'short')}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = recordsHTML;
}

/**
 * Update recent runs list
 */
function updateRecentRuns() {
    let runs = getRuns();

    // Apply filter if not 'all'
    if (currentRunTypeFilter !== 'all') {
        runs = runs.filter(run => run.type === currentRunTypeFilter);
    }

    // Get 5 most recent (after filtering)
    runs = runs.slice(0, 5);

    const container = document.getElementById('recent-runs');

    if (runs.length === 0) {
        if (currentRunTypeFilter === 'all') {
            container.innerHTML = '<p class="empty-state">No runs logged yet. <a href="#log-run">Log your first run!</a></p>';
        } else {
            container.innerHTML = `<p class="empty-state">No ${currentRunTypeFilter} runs found.</p>`;
        }
        return;
    }

    container.innerHTML = runs.map(run => createRunCard(run)).join('');
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
 * Set up run type filter dropdown
 */
function setupRunTypeFilter() {
    const filterSelect = document.getElementById('run-type-filter');

    if (!filterSelect) return;

    // Remove old listener to prevent memory leaks
    filterSelect.removeEventListener('change', handleFilterChange);

    // Add event listener
    filterSelect.addEventListener('change', handleFilterChange);
}

/**
 * Handle filter dropdown change
 * @param {Event} event - Change event
 */
function handleFilterChange(event) {
    currentRunTypeFilter = event.target.value;
    updateRecentRuns();
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
 * @returns {string} HTML string
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

    const typeColor = runTypeColors[run.type] || '#6b7280';

    // Escape HTML in notes to prevent XSS
    const safeNotes = run.notes ? run.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    return `
        <div class="run-item" data-run-id="${run.id}">
            <div class="run-item-main">
                <div class="run-item-header">
                    <span class="run-type-badge ${run.type}" style="background-color: ${typeColor}20; color: ${typeColor};">
                        ${run.type}
                    </span>
                    <span class="run-date">${formatDate(run.date)}</span>
                </div>
                <div class="run-stats">
                    <div class="run-stat">
                        <span class="run-stat-label">Distance</span>
                        <span class="run-stat-value">${run.distance.toFixed(2)} km</span>
                    </div>
                    <div class="run-stat">
                        <span class="run-stat-label">Time</span>
                        <span class="run-stat-value">${formatDuration(run.time)}</span>
                    </div>
                    <div class="run-stat">
                        <span class="run-stat-label">Pace</span>
                        <span class="run-stat-value">${formatPace(run.pace)}</span>
                    </div>
                    ${run.heartRate ? `
                        <div class="run-stat">
                            <span class="run-stat-label">❤️ Avg HR</span>
                            <span class="run-stat-value">${run.heartRate} bpm</span>
                        </div>
                    ` : ''}
                </div>
                ${safeNotes ? `<div class="run-notes" style="margin-top: var(--spacing-sm); color: var(--text-secondary); font-size: var(--font-size-sm);">${safeNotes}</div>` : ''}
                ${run.gym || run.bodyweight ? `
                    <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--text-secondary);">
                        ${run.gym ? '<span style="margin-right: var(--spacing-sm);">💪 Gym</span>' : ''}
                        ${run.bodyweight ? '<span>🏋️ Bodyweight</span>' : ''}
                    </div>
                ` : ''}
            </div>
            <div class="run-item-actions" style="margin-top: var(--spacing-sm); display: flex; gap: var(--spacing-sm);">
                <button class="btn-edit-run" data-run-id="${run.id}" style="flex: 1; padding: var(--spacing-sm); border: 1px solid var(--border-color); background: white; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-sm);">Edit</button>
                <button class="btn-delete-run" data-run-id="${run.id}" style="flex: 1; padding: var(--spacing-sm); border: 1px solid var(--danger-color); background: white; color: var(--danger-color); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-sm);">Delete</button>
            </div>
        </div>
    `;
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
    const exportCSVButton = document.getElementById('btn-export-csv');
    const importButton = document.getElementById('btn-import-data');
    const fileInput = document.getElementById('import-file-input');

    // Remove old listeners to prevent memory leaks
    exportButton.removeEventListener('click', handleExportData);
    exportCSVButton.removeEventListener('click', handleExportCSV);
    importButton.removeEventListener('click', handleImportButtonClick);
    fileInput.removeEventListener('change', handleFileSelected);

    // Add event listeners
    exportButton.addEventListener('click', handleExportData);
    exportCSVButton.addEventListener('click', handleExportCSV);
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
 * Handle export CSV button click
 */
function handleExportCSV() {
    try {
        // Get the data as CSV string
        const csvData = exportRunsAsCSV();

        if (csvData === 'No runs to export') {
            showImportStatus('No runs to export yet.', 'error');
            return;
        }

        // Create a blob and download link
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `running-dashboard-runs-${getTodayISO()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        showImportStatus('Runs exported to CSV successfully!', 'success');
    } catch (error) {
        console.error('CSV Export error:', error);
        showImportStatus('Failed to export CSV. Please try again.', 'error');
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
