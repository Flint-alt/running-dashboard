/**
 * progress.js - Progress tracking view
 * Displays statistics and charts for training progress
 */

import { getRuns, getStatistics, getSettings, getMonthlyStats, getRunTypeDistribution } from '../data/storage.js';
import { formatDuration, formatPace } from '../utils/pace.js';
import { getCurrentWeek, getTodayISO } from '../utils/date.js';
import { getWeekPlan } from '../data/trainingPlan.js';

// Chart instances (to destroy before creating new ones)
let weeklyMileageChart = null;
let paceTrendChart = null;
let runTypeChart = null;

/**
 * Initialize progress view
 */
export function initProgress() {
    updateStatistics();
    renderWeeklyMileageChart();
    renderMonthlyStats();
    renderPaceTrendChart();
    renderRunTypeChart();
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
        // Fallback if Chart.js not loaded
        canvas.parentElement.innerHTML = '<p class="empty-state">Chart.js not loaded. Please refresh the page.</p>';
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

/**
 * Render monthly statistics summary
 */
function renderMonthlyStats() {
    const monthlyStats = getMonthlyStats();
    const container = document.getElementById('monthly-summary');

    if (monthlyStats.length === 0) {
        container.innerHTML = '<p class="empty-state">No runs logged yet.</p>';
        return;
    }

    // Format month names nicely
    const formatMonth = (monthStr) => {
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const statsHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--spacing-md);">
            ${monthlyStats.map((stat, index) => `
                <div style="padding: var(--spacing-md); background: ${index === 0 ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f9fafb'}; border-radius: var(--radius-md); border: 2px solid ${index === 0 ? '#3b82f6' : '#e5e7eb'};">
                    <div style="font-size: var(--font-size-sm); font-weight: 600; color: ${index === 0 ? '#1e40af' : '#6b7280'}; margin-bottom: var(--spacing-xs);">
                        ${formatMonth(stat.month)}${index === 0 ? ' (Current)' : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-sm);">
                        <div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Distance</div>
                            <div style="font-size: var(--font-size-lg); font-weight: 700; color: ${index === 0 ? '#1e40af' : '#374151'};">${stat.distance.toFixed(1)} km</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Runs</div>
                            <div style="font-size: var(--font-size-lg); font-weight: 700; color: ${index === 0 ? '#1e40af' : '#374151'};">${stat.runs}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = statsHTML;
}

/**
 * Render pace trend chart (pace over time)
 */
function renderPaceTrendChart() {
    const canvas = document.getElementById('pace-trend-chart');
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (paceTrendChart) {
        paceTrendChart.destroy();
    }

    const runs = getRuns().reverse(); // Oldest to newest for trend

    if (runs.length === 0) {
        canvas.parentElement.innerHTML = '<p class="empty-state">No runs logged yet.</p>';
        return;
    }

    // Prepare data (only include runs with valid pace)
    const labels = runs.map(run => {
        const date = new Date(run.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const paceData = runs.map(run => (run.pace / 60).toFixed(2)); // Convert to minutes

    // Create chart
    if (typeof Chart !== 'undefined') {
        paceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Pace (min/km)',
                        data: paceData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
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
                        callbacks: {
                            label: (context) => {
                                const pace = context.parsed.y;
                                const minutes = Math.floor(pace);
                                const seconds = Math.round((pace - minutes) * 60);
                                return `Pace: ${minutes}:${seconds.toString().padStart(2, '0')} /km`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        reverse: true, // Lower pace (faster) is better, so reverse the axis
                        title: {
                            display: true,
                            text: 'Pace (min/km) - Lower is Faster'
                        },
                        ticks: {
                            callback: (value) => {
                                const minutes = Math.floor(value);
                                const seconds = Math.round((value - minutes) * 60);
                                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    } else {
        canvas.parentElement.innerHTML = '<p class="empty-state">Chart.js not loaded. Please refresh the page.</p>';
    }
}

/**
 * Render run type distribution pie chart
 */
function renderRunTypeChart() {
    const canvas = document.getElementById('run-type-chart');
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (runTypeChart) {
        runTypeChart.destroy();
    }

    const distribution = getRunTypeDistribution();

    if (Object.keys(distribution).length === 0) {
        canvas.parentElement.innerHTML = '<p class="empty-state">No runs logged yet.</p>';
        return;
    }

    // Define colors for each run type
    const typeColors = {
        parkrun: '#2563eb',
        long: '#ec4899',
        easy: '#10b981',
        tempo: '#f59e0b',
        intervals: '#ef4444',
        recovery: '#8b5cf6',
        treadmill: '#06b6d4'
    };

    // Prepare data
    const labels = Object.keys(distribution).map(type => {
        // Capitalize first letter
        return type.charAt(0).toUpperCase() + type.slice(1);
    });

    const data = Object.values(distribution);
    const colors = Object.keys(distribution).map(type => typeColors[type] || '#6b7280');

    // Create chart
    if (typeof Chart !== 'undefined') {
        runTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Run Count',
                        data,
                        backgroundColor: colors.map(c => c + '80'), // Add transparency
                        borderColor: colors,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} runs (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        canvas.parentElement.innerHTML = '<p class="empty-state">Chart.js not loaded. Please refresh the page.</p>';
    }
}
