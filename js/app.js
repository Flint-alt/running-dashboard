/**
 * app.js - Main application entry point
 * Initializes the running training dashboard
 */

import { initializeStorage } from './data/storage.js';
import { initRouter } from './components/navigation.js';
import { initDashboard } from './views/dashboard.js';

/**
 * Initialize the application
 * Called when DOM is fully loaded
 */
function initApp() {
    console.log('🏃 Running Training Dashboard - Initializing...');

    // Initialize localStorage
    initializeStorage();
    console.log('✓ Storage initialized');

    // Initialize dashboard (will be shown first)
    initDashboard();
    console.log('✓ Dashboard initialized');

    // Initialize router (handles navigation between pages)
    initRouter();
    console.log('✓ Router initialized');

    console.log('✅ Application ready!');
    console.log('📍 Navigate using the menu above or by changing the URL hash (#dashboard, #log-run, etc.)');
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

// Export for debugging purposes
export { initApp };
