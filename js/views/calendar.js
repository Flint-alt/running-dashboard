/**
 * calendar.js - Calendar view with visual run tracking
 * Running Training Dashboard
 */

import { getRuns } from '../data/storage.js';
import { formatPace, formatDuration } from '../utils/pace.js';

// Current displayed month
let currentMonth = new Date();

/**
 * Initialize the calendar view
 */
export function initCalendar() {
    // Set to current month
    currentMonth = new Date();

    // Render calendar
    renderCalendar();

    // Set up navigation
    setupNavigation();
}

/**
 * Set up month navigation
 */
function setupNavigation() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    // Remove old listeners
    prevBtn.replaceWith(prevBtn.cloneNode(true));
    nextBtn.replaceWith(nextBtn.cloneNode(true));

    // Get fresh references
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');

    prevButton.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextButton.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
}

/**
 * Render the calendar for current month
 */
function renderCalendar() {
    const runs = getRuns();
    const grid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('calendar-month-year');

    // Clear grid
    grid.innerHTML = '';

    // Get calendar data
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    monthYearDisplay.textContent = monthName;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Create a map of runs by date
    const runsByDate = {};
    runs.forEach(run => {
        if (!runsByDate[run.date]) {
            runsByDate[run.date] = [];
        }
        runsByDate[run.date].push(run);
    });

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const dayRuns = runsByDate[dateString] || [];

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        // Check if today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Run indicators
        if (dayRuns.length > 0) {
            dayCell.classList.add('has-runs');

            const runIndicators = document.createElement('div');
            runIndicators.className = 'run-indicators';

            dayRuns.forEach(run => {
                const indicator = document.createElement('div');
                indicator.className = 'run-indicator';
                indicator.style.backgroundColor = getRunTypeColor(run.type);
                indicator.title = `${run.type}: ${run.distance}km`;
                runIndicators.appendChild(indicator);
            });

            dayCell.appendChild(runIndicators);

            // Make clickable
            dayCell.style.cursor = 'pointer';
            dayCell.addEventListener('click', () => showDayDetails(dateString, dayRuns));
        }

        grid.appendChild(dayCell);
    }
}

/**
 * Show details for a selected day
 * @param {string} dateString - ISO date string
 * @param {Array} runs - Runs for that day
 */
function showDayDetails(dateString, runs) {
    const detailsCard = document.getElementById('calendar-day-details');
    const dateHeader = document.getElementById('selected-date');
    const runsContainer = document.getElementById('selected-day-runs');

    // Format date
    const date = new Date(dateString + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    dateHeader.textContent = formattedDate;

    // Render runs
    runsContainer.innerHTML = runs.map(run => `
        <div class="calendar-run-detail" style="padding: var(--spacing-md); margin-bottom: var(--spacing-sm); border-left: 4px solid ${getRunTypeColor(run.type)}; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                <span style="font-weight: 600; color: ${getRunTypeColor(run.type)}; text-transform: capitalize;">${run.type}</span>
                <span style="color: var(--text-tertiary); font-size: var(--font-size-sm);">${run.distance} km</span>
            </div>
            <div style="display: flex; gap: var(--spacing-lg); font-size: var(--font-size-sm); color: var(--text-secondary);">
                <div>⏱️ ${formatDuration(run.time)}</div>
                <div>⚡ ${formatPace(run.pace)}</div>
                ${run.heartRate ? `<div>❤️ ${run.heartRate} bpm</div>` : ''}
            </div>
            ${run.notes ? `<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-sm); color: var(--text-secondary); font-style: italic;">"${run.notes}"</div>` : ''}
        </div>
    `).join('');

    // Show card
    detailsCard.style.display = 'block';

    // Scroll to details
    detailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Get color for run type
 * @param {string} type - Run type
 * @returns {string} Hex color
 */
function getRunTypeColor(type) {
    const colors = {
        parkrun: '#2563eb',
        long: '#ec4899',
        easy: '#10b981',
        tempo: '#f59e0b',
        intervals: '#ef4444',
        recovery: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
}
