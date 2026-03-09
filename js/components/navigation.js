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
import { initSettings } from '../views/settings.js';

// Route handlers - functions to call when navigating to each page
const routes = {
    'dashboard': updateDashboard,
    'training-plan': initTrainingPlan,
    'log-run': initLogRun,
    'progress': initProgress,
    'weight': initWeight,
    'settings': initSettings
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

    // Set up dark mode toggle
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

    const setMenuState = (isOpen) => {
        navToggle.classList.toggle('active', isOpen);
        navLinks.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    // Toggle menu when hamburger is clicked
    navToggle.addEventListener('click', () => {
        const isOpen = navToggle.classList.contains('active');
        setMenuState(!isOpen);
    });

    // Close menu when a nav link is clicked
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            setMenuState(false);
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            setMenuState(false);
        }
    });

    // Close menu with Escape for keyboard accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navToggle.classList.contains('active')) {
            setMenuState(false);
            navToggle.focus();
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

    // Toggle FAB visibility (hide on log-run page)
    const fab = document.getElementById('quick-log-fab');
    if (fab) {
        fab.classList.toggle('hidden', hash === 'log-run');
    }

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
 * Initialize dark mode toggle
 * Reads preference from localStorage and sets up the toggle button
 */
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Apply saved preference on load
    const saved = localStorage.getItem('runningDashboardTheme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('runningDashboardTheme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('runningDashboardTheme', 'dark');
        }
    });
}
