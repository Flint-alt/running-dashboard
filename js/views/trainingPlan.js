/**
 * trainingPlan.js - Training plan view
 * Displays the complete 44-week training plan
 */

import { getTodayISO, getCurrentWeek } from '../utils/date.js';
import { getSettings } from '../data/storage.js';
import { getAllWeeks } from '../data/trainingPlan.js';

/**
 * Initialize and render the training plan view
 */
export function initTrainingPlan() {
    renderTrainingPlan();
}

/**
 * Render the training plan grid
 */
function renderTrainingPlan() {
    const container = document.getElementById('training-plan-grid');
    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    const weeks = getAllWeeks();

    container.innerHTML = weeks.map(week =>
        createWeekCard(week, currentWeek)
    ).join('');
}

/**
 * Create HTML for a week card
 * @param {Object} weekPlan - Week plan object
 * @param {number} currentWeek - Current training week number
 * @returns {string} HTML string
 */
function createWeekCard(weekPlan, currentWeek) {
    const isCurrent = weekPlan.week === currentWeek;
    const isPast = weekPlan.week < currentWeek;

    let badges = '';

    if (weekPlan.isRecovery) {
        badges += '<span class="badge badge-recovery">Recovery</span> ';
    }

    if (weekPlan.milestone) {
        badges += `<span class="badge badge-milestone">${weekPlan.milestone.name}</span>`;
    }

    return `
        <div class="week-card ${isCurrent ? 'current-week' : ''}" style="opacity: ${isPast ? '0.7' : '1'};">
            <div class="week-card-header">
                <span class="week-number">Week ${weekPlan.week}</span>
                <span class="phase-badge phase-${weekPlan.phase.id}">Phase ${weekPlan.phase.id}</span>
            </div>
            <div class="week-dates">${weekPlan.dateRange.formatted}</div>

            ${badges ? `<div style="margin-bottom: var(--spacing-sm);">${badges}</div>` : ''}

            <div class="week-runs">
                <div class="week-run">
                    <span>Parkrun</span>
                    <span><strong>${weekPlan.parkrun} km</strong></span>
                </div>
                <div class="week-run">
                    <span>Long Run</span>
                    <span><strong>${weekPlan.longRun} km</strong></span>
                </div>
                <div class="week-run" style="background-color: transparent; font-weight: 600; margin-top: var(--spacing-xs);">
                    <span>Total</span>
                    <span>${weekPlan.totalDistance} km</span>
                </div>
            </div>

            ${isCurrent ? '<div style="margin-top: var(--spacing-sm); text-align: center; color: var(--primary-color); font-weight: 600; font-size: var(--font-size-sm);">← Current Week</div>' : ''}
        </div>
    `;
}
