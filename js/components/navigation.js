/**
 * Navigation.js - Hash-based routing for single-page application
 * Running Training Dashboard
 */

// Import view modules (these will initialize their respective pages)
import { initDashboard, updateDashboard } from '../views/dashboard.js';
import { initLogRun } from '../views/logRun.js';
import { initProgress } from '../views/progress.js';
import { initWeight } from '../views/weight.js';
import { initTrainingPlan } from '../views/trainingPlan.js';
import { initCalendar } from '../views/calendar.js';

// Route handlers - functions to call when navigating to each page
const routes = {
    'dashboard': updateDashboard,
    'calendar': initCalendar,
    'training-plan': initTrainingPlan,
    'log-run': initLogRun,
    'progress': initProgress,
    'weight': initWeight
};

/**
 * Initialize the routing system
 * Sets up hash change listener and handles initial route
 */
export function initRouter() {
    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Handle initial route on page load
    handleRoute();

    // Set up mobile navigation toggle
    initMobileNav();

    // Set up theme toggle
    initThemeToggle();

    console.log('Router initialized');
}

/**
 * Initialize mobile navigation toggle
 * Handles hamburger menu functionality on mobile devices
 */
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinkElements = document.querySelectorAll('.nav-link');

    if (!navToggle || !navLinks) return;

    // Toggle menu when hamburger is clicked
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when a nav link is clicked
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

/**
 * Handle route changes
 * Called when hash changes or on initial load
 */
function handleRoute() {
    // Get hash without the '#' symbol, default to 'dashboard'
    let hash = window.location.hash.slice(1) || 'dashboard';

    // Validate route exists
    if (!routes[hash]) {
        console.warn(`Route '${hash}' not found, defaulting to dashboard`);
        hash = 'dashboard';
        window.location.hash = 'dashboard';
    }

    // Hide all page sections
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the active section
    const activeSection = document.getElementById(hash);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Update navigation active state
    updateActiveNav(hash);

    // Call the route handler (updates the page content)
    const routeHandler = routes[hash];
    if (routeHandler) {
        routeHandler();
    }
}

/**
 * Update navigation to show which page is active
 * @param {string} activePage - The current active page ID
 */
function updateActiveNav(activePage) {
    // Remove active class from all nav links
    const allLinks = document.querySelectorAll('.nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to current page's nav link
    const activeLink = document.querySelector(`.nav-link[data-page="${activePage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

/**
 * Programmatically navigate to a route
 * @param {string} route - The route to navigate to
 */
export function navigate(route) {
    window.location.hash = route;
}

/**
 * Get the current route
 * @returns {string} Current route (without '#')
 */
export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'dashboard';
}

/**
 * Refresh the current page (re-call its handler)
 * Useful after data changes to update the view
 */
export function refreshCurrentPage() {
    handleRoute();
}

/**
 * Initialize theme toggle
 * Handles dark mode switching and persistence
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');

    if (!themeToggle) return;

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/**
 * Apply theme to document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
    const themeIcon = document.querySelector('.theme-icon');

    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
}
