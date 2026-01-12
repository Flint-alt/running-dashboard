/**
 * progress.js - Progress tracking view
 * Displays statistics and charts for training progress
 */

import { getRuns, getStatistics, getSettings } from '../data/storage.js';
import { formatDuration, formatPace } from '../utils/pace.js';
import { getCurrentWeek, getTodayISO } from '../utils/date.js';
import { getWeekPlan } from '../data/trainingPlan.js';

// Chart instance (to destroy before creating new one)
let weeklyMileageChart = null;

/**
 * Initialize progress view
 */
export function initProgress() {
    updateStatistics();
    renderWeeklyMileageChart();
}

/**
 * Update statistics cards
 */
function updateStatistics() {
    const stats = getStatistics();

    document.getElementById('total-distance').textContent = `${stats.totalDistance.toFixed(1)} km`;
    document.getElementById('total-time').textContent = formatDuration(stats.totalTime);
    document.getElementById('avg-pace').textContent = stats.averagePace > 0 ? formatPace(stats.averagePace) : '-';
    document.getElementById('longest-run').textContent = `${stats.longestRun.toFixed(1)} km`;
}

/**
 * Render weekly mileage chart comparing planned vs actual
 */
function renderWeeklyMileageChart() {
    const canvas = document.getElementById('weekly-mileage-chart');
    const chartErrorId = 'progress-chart-error';
    const chartError = canvas ? canvas.parentElement.querySelector(`#${chartErrorId}`) : null;

    // Clean up any previous error messages
    if (chartError) {
        chartError.remove();
    }

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (weeklyMileageChart) {
        weeklyMileageChart.destroy();
    }

    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    // Get data for weeks 1 through current week (or week 1-12 if early in plan)
    const maxWeek = Math.max(12, Math.min(44, currentWeek));
    const weeks = [];
    const plannedData = [];
    const actualData = [];
    const phaseColors = [];

    for (let week = 1; week <= maxWeek; week++) {
        const weekPlan = getWeekPlan(week);
        const runs = getRuns().filter(run => run.week === week);
        const actualDistance = runs.reduce((sum, run) => sum + run.distance, 0);

        weeks.push(`Week ${week}`);
        plannedData.push(weekPlan.totalDistance);
        actualData.push(actualDistance);

        // Color by phase
        const phaseColor = getPhaseColor(weekPlan.phase.id);
        phaseColors.push(phaseColor);
    }

    // Ensure canvas is visible
    canvas.style.display = '';

    // Create chart using Chart.js
    if (typeof Chart !== 'undefined') {
        weeklyMileageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks,
                datasets: [
                    {
                        label: 'Planned',
                        data: plannedData,
                        backgroundColor: 'rgba(156, 163, 175, 0.3)',
                        borderColor: 'rgba(156, 163, 175, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: actualData,
                        backgroundColor: 'rgba(37, 99, 235, 0.5)',
                        borderColor: 'rgba(37, 99, 235, 1)',
                        borderWidth: 1
                    }
                ]
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Distance (km)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Training Week'
                        }
                    }
                }
            }
        });
    } else {
        // Fallback if Chart.js not loaded - show error without destroying canvas
        const errorMessage = document.createElement('p');
        errorMessage.id = chartErrorId;
        errorMessage.className = 'empty-state';
        errorMessage.textContent = 'Chart.js not loaded. Please refresh the page.';
        canvas.parentElement.appendChild(errorMessage);
        canvas.style.display = 'none';
    }
}

/**
 * Get color for phase
 * @param {number} phaseId - Phase ID (1-4)
 * @returns {string} Hex color
 */
function getPhaseColor(phaseId) {
    const colors = {
        1: '#3b82f6',
        2: '#8b5cf6',
        3: '#ec4899',
        4: '#f59e0b'
    };
    return colors[phaseId] || '#6b7280';
}
