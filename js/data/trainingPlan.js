/**
 * trainingPlan.js - 44-week half marathon training plan data
 * Running Training Dashboard
 */

import { getWeekDateRange, formatDateRange } from '../utils/date.js';
import { getSettings } from './storage.js';

// Define training phases
export const PHASES = [
    {
        id: 1,
        name: 'Phase 1: Build to 10k',
        weeks: [1, 12],
        description: 'Building aerobic base with consistent mileage'
    },
    {
        id: 2,
        name: 'Phase 2: Extend to 15k',
        weeks: [13, 24],
        description: 'Gradually increasing long run distance'
    },
    {
        id: 3,
        name: 'Phase 3: Build to 20k',
        weeks: [25, 36],
        description: 'Peak distance and endurance building'
    },
    {
        id: 4,
        name: 'Phase 4: Race Prep & Taper',
        weeks: [37, 44],
        description: 'Final preparation and taper for race day'
    }
];

// Recovery weeks (every 4th week)
export const RECOVERY_WEEKS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];

// Milestones
export const MILESTONES = [
    { week: 9, distance: 10, name: 'First 10K!' },
    { week: 23, distance: 15, name: 'First 15K!' },
    { week: 35, distance: 20, name: 'First 20K!' },
    { week: 44, distance: 21.1, name: 'Half Marathon Race Day!' }
];

// Complete 44-week plan
// Long run distances in kilometers
export const WEEKLY_PLAN = [
    // Phase 1: Weeks 1-12 (Build to 10k)
    { week: 1, longRun: 7, parkrun: 5, isRecovery: false },
    { week: 2, longRun: 7.5, parkrun: 5, isRecovery: false },
    { week: 3, longRun: 8, parkrun: 5, isRecovery: false },
    { week: 4, longRun: 6, parkrun: 5, isRecovery: true },     // Recovery
    { week: 5, longRun: 8.5, parkrun: 5, isRecovery: false },
    { week: 6, longRun: 9, parkrun: 5, isRecovery: false },
    { week: 7, longRun: 9.5, parkrun: 5, isRecovery: false },
    { week: 8, longRun: 7, parkrun: 5, isRecovery: true },     // Recovery
    { week: 9, longRun: 10, parkrun: 5, isRecovery: false },   // MILESTONE: First 10k
    { week: 10, longRun: 10, parkrun: 5, isRecovery: false },
    { week: 11, longRun: 10, parkrun: 5, isRecovery: false },
    { week: 12, longRun: 8, parkrun: 5, isRecovery: true },    // Recovery (End Phase 1)

    // Phase 2: Weeks 13-24 (Extend to 15k)
    { week: 13, longRun: 11, parkrun: 5, isRecovery: false },
    { week: 14, longRun: 11.5, parkrun: 5, isRecovery: false },
    { week: 15, longRun: 12, parkrun: 5, isRecovery: false },
    { week: 16, longRun: 9, parkrun: 5, isRecovery: true },    // Recovery
    { week: 17, longRun: 12.5, parkrun: 5, isRecovery: false },
    { week: 18, longRun: 13, parkrun: 5, isRecovery: false },
    { week: 19, longRun: 13.5, parkrun: 5, isRecovery: false },
    { week: 20, longRun: 10, parkrun: 5, isRecovery: true },   // Recovery
    { week: 21, longRun: 14, parkrun: 5, isRecovery: false },
    { week: 22, longRun: 14.5, parkrun: 5, isRecovery: false },
    { week: 23, longRun: 15, parkrun: 5, isRecovery: false },  // MILESTONE: First 15k
    { week: 24, longRun: 11, parkrun: 5, isRecovery: true },   // Recovery (End Phase 2)

    // Phase 3: Weeks 25-36 (Build to 20k)
    { week: 25, longRun: 15.5, parkrun: 5, isRecovery: false },
    { week: 26, longRun: 16, parkrun: 5, isRecovery: false },
    { week: 27, longRun: 16.5, parkrun: 5, isRecovery: false },
    { week: 28, longRun: 12, parkrun: 5, isRecovery: true },   // Recovery
    { week: 29, longRun: 17, parkrun: 5, isRecovery: false },
    { week: 30, longRun: 17.5, parkrun: 5, isRecovery: false },
    { week: 31, longRun: 18, parkrun: 5, isRecovery: false },
    { week: 32, longRun: 13, parkrun: 5, isRecovery: true },   // Recovery
    { week: 33, longRun: 18.5, parkrun: 5, isRecovery: false },
    { week: 34, longRun: 19, parkrun: 5, isRecovery: false },
    { week: 35, longRun: 20, parkrun: 5, isRecovery: false },  // MILESTONE: First 20k
    { week: 36, longRun: 14, parkrun: 5, isRecovery: true },   // Recovery (End Phase 3)

    // Phase 4: Weeks 37-44 (Race Prep & Taper)
    { week: 37, longRun: 18, parkrun: 5, isRecovery: false },
    { week: 38, longRun: 19, parkrun: 5, isRecovery: false },
    { week: 39, longRun: 15, parkrun: 5, isRecovery: true },   // Recovery
    { week: 40, longRun: 18, parkrun: 5, isRecovery: false },
    { week: 41, longRun: 16, parkrun: 5, isRecovery: false },  // Taper begins
    { week: 42, longRun: 13, parkrun: 5, isRecovery: false },  // Taper
    { week: 43, longRun: 10, parkrun: 5, isRecovery: false },  // Taper
    { week: 44, longRun: 21.1, parkrun: 3, isRecovery: false } // RACE DAY! (easy 3k earlier in week)
];

/**
 * Get the phase for a specific week
 * @param {number} weekNumber - Week number (1-44)
 * @returns {Object} Phase object
 */
export function getPhaseForWeek(weekNumber) {
    return PHASES.find(phase => weekNumber >= phase.weeks[0] && weekNumber <= phase.weeks[1]);
}

/**
 * Get milestone for a specific week
 * @param {number} weekNumber - Week number (1-44)
 * @returns {Object|null} Milestone object or null
 */
export function getMilestoneForWeek(weekNumber) {
    return MILESTONES.find(m => m.week === weekNumber) || null;
}

/**
 * Check if a week is a recovery week
 * @param {number} weekNumber - Week number (1-44)
 * @returns {boolean} True if recovery week
 */
export function isRecoveryWeek(weekNumber) {
    return RECOVERY_WEEKS.includes(weekNumber);
}

/**
 * Get plan for a specific week
 * @param {number} weekNumber - Week number (1-44)
 * @returns {Object} Week plan with all details
 */
export function getWeekPlan(weekNumber) {
    const settings = getSettings();
    const planStartDate = settings.trainingPlanStart;

    // Get base week data
    const weekData = WEEKLY_PLAN.find(w => w.week === weekNumber);

    if (!weekData) {
        return null;
    }

    // Get date range
    const dateRange = getWeekDateRange(planStartDate, weekNumber);

    // Get phase
    const phase = getPhaseForWeek(weekNumber);

    // Get milestone if any
    const milestone = getMilestoneForWeek(weekNumber);

    // Calculate total planned distance
    const totalDistance = weekData.parkrun + weekData.longRun;

    return {
        week: weekNumber,
        longRun: weekData.longRun,
        parkrun: weekData.parkrun,
        totalDistance,
        isRecovery: weekData.isRecovery,
        dateRange: {
            start: dateRange.start,
            end: dateRange.end,
            formatted: formatDateRange(dateRange.start, dateRange.end)
        },
        phase: {
            id: phase.id,
            name: phase.name,
            description: phase.description
        },
        milestone: milestone
    };
}

/**
 * Get all 44 weeks of the plan
 * @returns {Array} Array of all week plan objects
 */
export function getAllWeeks() {
    const weeks = [];
    for (let i = 1; i <= 44; i++) {
        weeks.push(getWeekPlan(i));
    }
    return weeks;
}

/**
 * Get weeks for a specific phase
 * @param {number} phaseId - Phase ID (1-4)
 * @returns {Array} Array of week plan objects for that phase
 */
export function getWeeksForPhase(phaseId) {
    const phase = PHASES.find(p => p.id === phaseId);
    if (!phase) return [];

    const weeks = [];
    for (let i = phase.weeks[0]; i <= phase.weeks[1]; i++) {
        weeks.push(getWeekPlan(i));
    }
    return weeks;
}

/**
 * Get upcoming milestones
 * @param {number} currentWeek - Current training week
 * @returns {Array} Array of upcoming milestones
 */
export function getUpcomingMilestones(currentWeek) {
    return MILESTONES.filter(m => m.week >= currentWeek);
}

/**
 * Get next milestone after current week
 * @param {number} currentWeek - Current training week
 * @returns {Object|null} Next milestone or null
 */
export function getNextMilestone(currentWeek) {
    const upcoming = getUpcomingMilestones(currentWeek);
    return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Calculate total planned distance for the entire program
 * @returns {number} Total kilometers
 */
export function getTotalProgramDistance() {
    return WEEKLY_PLAN.reduce((total, week) => total + week.longRun + week.parkrun, 0);
}

/**
 * Get summary statistics for a phase
 * @param {number} phaseId - Phase ID (1-4)
 * @returns {Object} Phase statistics
 */
export function getPhaseStats(phaseId) {
    const weeks = getWeeksForPhase(phaseId);

    const totalDistance = weeks.reduce((sum, week) => sum + week.totalDistance, 0);
    const longestRun = Math.max(...weeks.map(week => week.longRun));
    const avgWeeklyDistance = totalDistance / weeks.length;

    return {
        totalDistance,
        longestRun,
        avgWeeklyDistance,
        weekCount: weeks.length
    };
}
