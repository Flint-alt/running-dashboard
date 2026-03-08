/**
 * dashboard.js - Main dashboard view
 * Displays training overview, recent runs, and progress summary
 */

import { getRuns, getRunsForWeek, getRun, deleteRun, saveRun, getSettings, getCurrentWeight, getWeightLost, getWeightProgress, exportData, importData, getRecords, getRunStreak, exportRunsAsCSV } from '../data/storage.js';
import { parseStravaCSV, deduplicateRuns } from '../utils/stravaImport.js';
import { getTodayISO, getCurrentWeek, formatDate, formatDateRange, getWeekDateRange, addDays, parseDate } from '../utils/date.js';
import { formatPace, formatDuration, formatDistance } from '../utils/pace.js';
import { getWeekPlan, getNextMilestone } from '../data/trainingPlan.js';

// Current run type filter
let currentRunTypeFilter = 'all';

/**
 * Animate a numeric value from 0 to target over a duration.
 * @param {HTMLElement} el - Element to update
 * @param {number} target - Target value
 * @param {Object} options - { duration, decimals, suffix, prefix }
 */
function animateValue(el, target, options = {}) {
    const { duration = 500, decimals = 0, suffix = '', prefix = '' } = options;
    const start = 0;
    const startTime = performance.now();

    // Skip animation for zero values
    if (target === 0) {
        el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        return;
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic for a natural deceleration feel
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;

        el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

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
    updateWeeklyCalendar();
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
 * Update the weekly calendar strip showing Mon-Sun with run indicators
 */
function updateWeeklyCalendar() {
    const container = document.getElementById('weekly-calendar-strip');
    if (!container) return;

    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);
    const runs = getRuns();

    // Get the Monday of the current week
    const todayDate = parseDate(today);
    const dayOfWeek = todayDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayISO = addDays(today, -daysToMonday);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Build day data
    const days = dayNames.map((name, i) => {
        const dateISO = addDays(mondayISO, i);
        const dateObj = parseDate(dateISO);
        const dayNum = dateObj.getDate();
        const isToday = dateISO === today;
        const isFuture = dateISO > today;

        // Find runs on this date
        const dayRuns = runs.filter(run => run.date === dateISO);

        return { name, dateISO, dayNum, isToday, isFuture, runs: dayRuns };
    });

    // Build HTML
    const weekLabel = currentWeek >= 1 && currentWeek <= 44
        ? `Week ${currentWeek}`
        : currentWeek < 1 ? 'Pre-training' : 'Post-training';

    container.innerHTML = `
        <div class="calendar-strip-header">
            <span class="calendar-strip-title">This Week</span>
            <span class="calendar-strip-week">${weekLabel}</span>
        </div>
        <div class="calendar-strip">
            ${days.map(day => {
                const hasRun = day.runs.length > 0;
                const firstRun = day.runs[0];
                const totalDistance = day.runs.reduce((sum, r) => sum + r.distance, 0);
                const runType = firstRun ? firstRun.type : '';

                let classes = 'calendar-day';
                if (day.isToday) classes += ' is-today';
                if (day.isFuture) classes += ' is-future';
                if (hasRun) classes += ' has-run';

                const indicatorClass = hasRun ? `calendar-day-indicator type-${runType}` : 'calendar-day-indicator';

                return `
                    <div class="${classes}">
                        <span class="calendar-day-name">${day.name}</span>
                        <span class="calendar-day-date">${day.dayNum}</span>
                        <span class="${indicatorClass}"></span>
                        <span class="calendar-day-distance">${hasRun ? totalDistance.toFixed(1) + 'km' : ''}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
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
    const progressRingFill = document.getElementById('progress-ring-fill');
    const progressPercentEl = document.getElementById('progress-ring-percent');

    // Handle case where we're before plan starts or after plan ends
    if (currentWeek < 1) {
        weekNumEl.textContent = '-';
        weekDatesEl.textContent = 'Training begins Jan 5, 2026';
        phaseBadgeEl.textContent = 'Upcoming';
        phaseBadgeEl.className = 'phase-badge';
        plannedParkrunEl.textContent = '-';
        plannedLongRunEl.textContent = '-';
        updateProgressRing(progressRingFill, progressPercentEl, 0);
        return;
    }

    if (currentWeek > 44) {
        weekNumEl.textContent = '44';
        weekDatesEl.textContent = 'Training plan finished';
        phaseBadgeEl.textContent = 'Done';
        phaseBadgeEl.className = 'phase-badge';
        plannedParkrunEl.textContent = '-';
        plannedLongRunEl.textContent = '-';
        updateProgressRing(progressRingFill, progressPercentEl, 100);
        return;
    }

    // Get week plan
    const weekPlan = getWeekPlan(currentWeek);

    weekNumEl.textContent = currentWeek;
    weekDatesEl.textContent = weekPlan.dateRange.formatted;

    // Update progress ring
    const percent = Math.round((currentWeek / 44) * 100);
    updateProgressRing(progressRingFill, progressPercentEl, percent);

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
 * Update the SVG progress ring fill and percentage label
 */
function updateProgressRing(fillEl, percentEl, percent) {
    if (!fillEl) return;
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    // Animate after a brief delay so the transition is visible on page load
    requestAnimationFrame(() => {
        fillEl.style.strokeDashoffset = offset;
    });
    if (percentEl) {
        percentEl.textContent = `${percent}% complete`;
    }
}

/**
 * Update weight progress card
 */
function updateWeightProgress() {
    const currentWeight = getCurrentWeight();
    const weightLost = getWeightLost();
    const progress = getWeightProgress();

    animateValue(document.getElementById('current-weight'), currentWeight, { decimals: 1, duration: 600 });
    animateValue(document.getElementById('weight-lost'), weightLost, { decimals: 1, suffix: ' kg', duration: 600 });

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

    animateValue(currentEl, streak.current, { duration: 600 });

    if (streak.longest === 1) {
        longestEl.textContent = '1 week';
    } else {
        longestEl.textContent = `${streak.longest} weeks`;
    }

    // Update the hero label with motivational message for streaks
    const heroLabel = document.querySelector('.streak-current .hero-stat-label');
    if (heroLabel) {
        if (streak.current >= 12) {
            heroLabel.textContent = 'amazing streak!';
        } else if (streak.current >= 4) {
            heroLabel.textContent = 'great streak!';
        } else {
            heroLabel.textContent = 'week streak';
        }
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
    animateValue(document.getElementById('week-distance'), totalDistance, { decimals: 1, suffix: ' km', duration: 600 });
    animateValue(document.getElementById('week-runs'), runCount, { duration: 400 });
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
        container.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#127942;</div>
                <div class="empty-state-title">No personal records yet</div>
                <div class="empty-state-message">Your fastest times and longest distances will appear here once you start logging runs.</div>
                <a href="#log-run" class="empty-state-action">Log Your First Run</a>
            </div>`;
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
            const settings = getSettings();
            const today = getTodayISO();
            const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);
            const weekPlan = getWeekPlan(currentWeek);
            let hint = '';
            if (weekPlan) {
                hint = `Week ${currentWeek} has a ${weekPlan.parkrun}km parkrun and a ${weekPlan.longRun}km long run planned.`;
            }
            container.innerHTML = `
                <div class="empty-state-enhanced">
                    <div class="empty-state-icon">&#127939;</div>
                    <div class="empty-state-title">No runs logged yet</div>
                    <div class="empty-state-message">${hint ? hint + ' ' : ''}Record your training sessions to track your progress here.</div>
                    <a href="#log-run" class="empty-state-action">Log Your First Run</a>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="empty-state-enhanced">
                    <div class="empty-state-icon">&#128269;</div>
                    <div class="empty-state-title">No ${currentRunTypeFilter} runs found</div>
                    <div class="empty-state-message">Try a different filter or log a ${currentRunTypeFilter} run.</div>
                </div>`;
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
 * Generate a sparkline SVG for pace trend of recent runs of the same type
 * @param {Object} run - The current run
 * @param {string} color - The color for the sparkline
 * @returns {string} SVG HTML string or empty string
 */
function generatePaceSparkline(run, color) {
    const allRuns = getRuns().reverse(); // oldest first
    const sameTypeRuns = allRuns.filter(r => r.type === run.type && r.pace > 0);

    if (sameTypeRuns.length < 2) return '';

    // Get last 8 runs of this type (including current)
    const recentRuns = sameTypeRuns.slice(-8);
    const paces = recentRuns.map(r => r.pace);

    const width = 60;
    const height = 24;
    const padding = 2;

    const minPace = Math.min(...paces);
    const maxPace = Math.max(...paces);
    const range = maxPace - minPace || 1;

    const points = paces.map((pace, i) => {
        const x = padding + (i / (paces.length - 1)) * (width - padding * 2);
        // Invert Y: lower pace = better = higher on chart
        const y = padding + ((pace - minPace) / range) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return `
        <svg class="pace-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />
            <circle cx="${paces.length > 1 ? (padding + ((paces.length - 1) / (paces.length - 1)) * (width - padding * 2)).toFixed(1) : padding}" cy="${(padding + ((paces[paces.length - 1] - minPace) / range) * (height - padding * 2)).toFixed(1)}" r="2" fill="${color}" />
        </svg>`;
}

function createRunCard(run) {
    const runTypeColors = {
        parkrun: '#2563eb',
        long: '#ec4899',
        easy: '#10b981',
        tempo: '#f59e0b',
        intervals: '#ef4444',
        recovery: '#8b5cf6',
        treadmill: '#06b6d4'
    };

    const typeColor = runTypeColors[run.type] || '#6b7280';
    const sparkline = generatePaceSparkline(run, typeColor);

    // Escape HTML in notes to prevent XSS
    const safeNotes = run.notes ? run.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    return `
        <div class="run-item" data-run-id="${run.id}">
            <div class="run-item-main">
                <div class="run-item-header">
                    <span class="run-type-badge ${run.type}" style="background-color: ${typeColor}20; color: ${typeColor};">
                        ${run.type}
                    </span>
                    <span class="run-date">${formatDate(run.date, 'short')}</span>
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
                        <span class="run-stat-value">${formatPace(run.pace)}${sparkline}</span>
                    </div>
                    ${run.heartRate ? `
                    <div class="run-stat">
                        <span class="run-stat-label">Avg HR</span>
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
        `Date: ${formatDate(run.date, 'short')}\n` +
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
    const stravaImportButton = document.getElementById('btn-import-strava');
    const stravaFileInput = document.getElementById('strava-file-input');

    // Remove old listeners to prevent memory leaks
    exportButton.removeEventListener('click', handleExportData);
    exportCSVButton.removeEventListener('click', handleExportCSV);
    importButton.removeEventListener('click', handleImportButtonClick);
    fileInput.removeEventListener('change', handleFileSelected);
    stravaImportButton.removeEventListener('click', handleStravaImportClick);
    stravaFileInput.removeEventListener('change', handleStravaFileSelected);

    // Add event listeners
    exportButton.addEventListener('click', handleExportData);
    exportCSVButton.addEventListener('click', handleExportCSV);
    importButton.addEventListener('click', handleImportButtonClick);
    fileInput.addEventListener('change', handleFileSelected);
    stravaImportButton.addEventListener('click', handleStravaImportClick);
    stravaFileInput.addEventListener('change', handleStravaFileSelected);
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
 * Handle Strava import button click — opens the CSV file picker
 */
function handleStravaImportClick() {
    document.getElementById('strava-file-input').click();
}

/**
 * Handle Strava CSV file selected for import
 * Parses the file, deduplicates against existing runs, then saves new runs.
 * @param {Event} event - Change event from file input
 */
function handleStravaFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected if needed
    event.target.value = '';

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const csvText = e.target.result;
            const { runs: parsedRuns, skipped, errors } = parseStravaCSV(csvText);

            if (parsedRuns.length === 0 && errors.length === 0) {
                showImportStatus(
                    `No running activities found in file. (${skipped} non-run activities skipped)`,
                    'error'
                );
                return;
            }

            // Deduplicate against what's already in the app
            const existingRuns = getRuns();
            const { newRuns, duplicateCount } = deduplicateRuns(parsedRuns, existingRuns);

            if (newRuns.length === 0) {
                showImportStatus(
                    `All ${duplicateCount} run(s) already exist — nothing new to import.`,
                    'error'
                );
                return;
            }

            const confirmed = confirm(
                `Found ${newRuns.length} new run(s) to import from Strava.\n` +
                `${duplicateCount > 0 ? `${duplicateCount} duplicate(s) will be skipped.\n` : ''}` +
                `${skipped > 0 ? `${skipped} non-running activit(ies) ignored.\n` : ''}` +
                (errors.length > 0 ? `${errors.length} row(s) could not be parsed.\n` : '') +
                `\nProceed?`
            );

            if (!confirmed) return;

            // Save each new run
            let saved = 0;
            for (const run of newRuns) {
                const result = saveRun(run);
                if (result.success) saved++;
            }

            const errorSummary = errors.length > 0
                ? ` (${errors.length} row(s) skipped due to parse errors)`
                : '';

            showImportStatus(
                `Successfully imported ${saved} run(s) from Strava.${errorSummary}`,
                'success'
            );

            updateDashboard();

        } catch (err) {
            console.error('Strava import error:', err);
            showImportStatus('Failed to parse Strava CSV. Make sure you selected the activities.csv file.', 'error');
        }
    };

    reader.onerror = () => {
        showImportStatus('Failed to read file. Please try again.', 'error');
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
