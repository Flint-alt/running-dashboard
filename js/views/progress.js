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
    renderHRZones();
    renderAdherenceScore();
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
        container.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#128197;</div>
                <div class="empty-state-title">No monthly data yet</div>
                <div class="empty-state-message">Monthly breakdowns of your distance, runs, and pace will appear here as you log runs.</div>
                <a href="#log-run" class="empty-state-action">Log a Run</a>
            </div>`;
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

    const runs = getRuns()
        .filter(run => run.type !== 'missed' && run.pace > 0)
        .reverse(); // Oldest to newest for trend

    if (runs.length === 0) {
        canvas.parentElement.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#128200;</div>
                <div class="empty-state-title">No pace data yet</div>
                <div class="empty-state-message">Your pace trend over time will be charted here as you log runs.</div>
                <a href="#log-run" class="empty-state-action">Log a Run</a>
            </div>`;
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
        canvas.parentElement.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#127912;</div>
                <div class="empty-state-title">No run data yet</div>
                <div class="empty-state-message">See how your training breaks down across parkruns, long runs, easy runs, and more.</div>
                <a href="#log-run" class="empty-state-action">Log a Run</a>
            </div>`;
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

/**
 * Render heart rate zone analysis
 * Uses configurable maxHeartRate from settings to calculate zones
 */
function renderHRZones() {
    const container = document.getElementById('hr-zones-container');
    if (!container) return;

    const settings = getSettings();
    const maxHR = settings.maxHeartRate || 185;
    const runs = getRuns().filter(r => r.type !== 'missed' && r.heartRate && r.heartRate > 0);

    if (runs.length === 0) {
        container.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#10084;</div>
                <div class="empty-state-title">No heart rate data yet</div>
                <div class="empty-state-message">Log runs with average heart rate to see zone breakdown.</div>
                <a href="#log-run" class="empty-state-action">Log a Run</a>
            </div>`;
        return;
    }

    // Define 5 zones as % of max HR
    const zones = [
        { name: 'Zone 1 – Recovery',   min: 0,    max: 0.60, color: '#93c5fd', desc: '< 60%' },
        { name: 'Zone 2 – Easy',       min: 0.60, max: 0.70, color: '#6ee7b7', desc: '60–70%' },
        { name: 'Zone 3 – Aerobic',    min: 0.70, max: 0.80, color: '#fcd34d', desc: '70–80%' },
        { name: 'Zone 4 – Threshold',  min: 0.80, max: 0.90, color: '#fb923c', desc: '80–90%' },
        { name: 'Zone 5 – Max Effort', min: 0.90, max: 1.01, color: '#f87171', desc: '> 90%' }
    ];

    const counts = zones.map(zone => ({
        ...zone,
        count: runs.filter(r => {
            const pct = r.heartRate / maxHR;
            return pct >= zone.min && pct < zone.max;
        }).length
    }));

    const totalWithHR = runs.length;

    const barsHTML = counts.map(z => {
        const pct = totalWithHR > 0 ? ((z.count / totalWithHR) * 100).toFixed(1) : 0;
        return `
            <div style="margin-bottom: var(--spacing-sm);">
                <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: 4px;">
                    <span style="font-weight: 600;">${z.name}</span>
                    <span style="color: var(--text-secondary);">${z.count} run${z.count !== 1 ? 's' : ''} (${pct}%)</span>
                </div>
                <div style="background: var(--border-color); border-radius: var(--radius-sm); height: 14px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: ${z.color}; transition: width 0.4s ease;"></div>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = `
        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-md);">
            Based on ${totalWithHR} run${totalWithHR !== 1 ? 's' : ''} with HR data. Max HR: ${maxHR} bpm
            (<a href="#settings" style="color: var(--primary-color);">change in Settings</a>).
        </p>
        ${barsHTML}`;
}

/**
 * Render training adherence score (planned vs actual per week)
 */
function renderAdherenceScore() {
    const container = document.getElementById('adherence-container');
    if (!container) return;

    const settings = getSettings();
    const today = getTodayISO();
    const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);

    if (currentWeek < 1) {
        container.innerHTML = `
            <div class="empty-state-enhanced">
                <div class="empty-state-icon">&#128203;</div>
                <div class="empty-state-title">Training hasn't started yet</div>
                <div class="empty-state-message">Adherence scores will appear once your training plan begins.</div>
            </div>`;
        return;
    }

    const allRuns = getRuns().filter(r => r.type !== 'missed');
    const maxWeek = Math.min(currentWeek, 44);
    let totalPlanned = 0;
    let totalActual = 0;
    const weekRows = [];

    for (let week = 1; week <= maxWeek; week++) {
        const weekPlan = getWeekPlan(week);
        const planned = weekPlan.totalDistance;
        const actual = allRuns
            .filter(r => r.week === week)
            .reduce((sum, r) => sum + r.distance, 0);

        totalPlanned += planned;
        totalActual += actual;

        const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
        const barColor = pct >= 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

        weekRows.push({ week, planned, actual, pct, barColor });
    }

    const overallPct = totalPlanned > 0
        ? Math.min((totalActual / totalPlanned) * 100, 100).toFixed(1)
        : 0;

    const overallColor = overallPct >= 80 ? '#22c55e' : overallPct >= 50 ? '#f59e0b' : '#ef4444';

    // Show last 12 weeks detail
    const recentWeeks = weekRows.slice(-12);

    const weeksHTML = recentWeeks.map(w => `
        <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 6px;">
            <span style="font-size: var(--font-size-xs); color: var(--text-secondary); width: 48px; flex-shrink: 0;">Wk ${w.week}</span>
            <div style="flex: 1; background: var(--border-color); border-radius: var(--radius-sm); height: 12px; overflow: hidden;">
                <div style="width: ${w.pct}%; height: 100%; background: ${w.barColor}; transition: width 0.4s ease;"></div>
            </div>
            <span style="font-size: var(--font-size-xs); color: var(--text-secondary); width: 80px; flex-shrink: 0; text-align: right;">
                ${w.actual.toFixed(1)}/${w.planned} km
            </span>
        </div>`).join('');

    container.innerHTML = `
        <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: var(--radius-md); border: 2px solid ${overallColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                <span style="font-weight: 700; font-size: var(--font-size-lg);">Overall Adherence</span>
                <span style="font-size: var(--font-size-xl); font-weight: 700; color: ${overallColor};">${overallPct}%</span>
            </div>
            <div style="background: white; border-radius: var(--radius-sm); height: 14px; overflow: hidden;">
                <div style="width: ${overallPct}%; height: 100%; background: ${overallColor}; transition: width 0.4s ease;"></div>
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                ${totalActual.toFixed(1)} km of ${totalPlanned} km planned (weeks 1–${maxWeek})
            </div>
        </div>
        <h4 style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-sm);">
            Last ${recentWeeks.length} weeks
        </h4>
        ${weeksHTML}`;
}
