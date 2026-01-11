# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript single-page application (SPA) for tracking half marathon training progress. No frameworks, no build tools - pure HTML, CSS, and ES6 modules with localStorage persistence.

**Training Plan:** 44 weeks (Jan 5, 2026 - Nov 8, 2026) building from 7km to half marathon (21.1km) with milestone goals at 10k, 15k, and 20k.

## Running the Application

Open `index.html` directly in a browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

**Note:** ES6 modules require either `file://` protocol or a local server. Using a local server is recommended to avoid CORS issues.

## Architecture

### Single-Page Application Structure

**Hash-based routing:** Navigation uses URL hash fragments (`#dashboard`, `#log-run`, etc.) managed by `js/components/navigation.js`. The router:
- Listens for `hashchange` events
- Shows/hides page sections using CSS classes (`active` class on `.page-section`)
- Calls view-specific initialization functions when navigating

**View lifecycle:** Each view module (`js/views/*.js`) exports an `init` function called by the router when that page is navigated to. Views read from storage, render the DOM, and set up event listeners.

**Data flow:** All data flows through `js/data/storage.js` which wraps `localStorage`. Views read data on render, update storage on user actions, then re-render or refresh.

### Module Organization

```
js/
├── app.js                    # Entry point: initializes storage and router
├── data/
│   ├── storage.js           # localStorage API (CRUD for runs, weights, settings)
│   └── trainingPlan.js      # 44-week plan data + date calculations
├── views/                   # Page components (each exports init function)
│   ├── dashboard.js         # Overview with week info, recent runs, weight
│   ├── logRun.js           # Form to record runs with auto-pace calculation
│   ├── trainingPlan.js     # 44-week calendar grid view
│   ├── progress.js         # Charts and statistics
│   └── weight.js           # Weight tracking with Chart.js
├── components/
│   └── navigation.js       # Hash-based SPA routing
└── utils/
    ├── date.js             # ISO date parsing, week calculations, ranges
    └── pace.js             # Time/pace conversions, formatting
```

### Key Data Structures

**localStorage schema** (`runningDashboard` key):
```javascript
{
  runs: [
    {
      id: "run_1234567890",
      date: "2026-01-12",      // ISO format (YYYY-MM-DD)
      type: "parkrun",         // parkrun|long|easy|tempo|intervals|recovery
      distance: 5,             // kilometers
      time: 1800,              // seconds
      pace: 360,               // seconds per km
      notes: "Felt strong",
      gym: false,
      bodyweight: false,
      week: 2                  // training week number
    }
  ],
  weights: [
    { id: "weight_1234567890", date: "2026-01-12", weight: 74.5, note: "..." }
  ],
  settings: {
    trainingPlanStart: "2026-01-05",  // Monday of Week 1
    goalWeight: 65,
    startingWeight: 74.5
  },
  milestones: {
    first10k: false,
    first15k: false,
    first20k: false,
    halfMarathon: false
  }
}
```

**Training week calculation:** Week numbers (1-44) are calculated from `trainingPlanStart` date using `getCurrentWeek(date, planStartDate)` in `js/utils/date.js`. Week 1 starts on the plan start date, each week is 7 days.

**Date handling:** All dates stored as ISO strings (YYYY-MM-DD) and parsed locally (not UTC) to avoid timezone issues. See `parseDate()` in `js/utils/date.js`.

**Milestone tracking:** Milestones are automatically checked and updated when runs are saved (storage.js:227-264). The system checks if any run meets the distance threshold:
- `first10k`: 10km or more
- `first15k`: 15km or more
- `first20k`: 20km or more
- `halfMarathon`: 21.1km or more

Milestones are one-way flags (once true, stay true even if run is deleted).

## Development Workflow

### Making Changes to Views

1. **Read the view module** (`js/views/*.js`) to understand current rendering
2. **Check storage.js** for available data access functions
3. **Update the view's init/update function** to modify rendering
4. **Test by refreshing** - no build step needed

### Adding New Features

When adding features that involve data:
1. **Update storage.js** with new getters/setters if needed
2. **Modify the data structure** in `getDefaultStore()` for new fields
3. **Update relevant views** to display/edit the new data
4. **Test localStorage** in DevTools → Application → localStorage

### Data Structure Evolution

When adding new fields to the data structure:
1. Add defaults in `getDefaultStore()` in storage.js
2. The `getStore()` function automatically merges user data with new defaults for backwards compatibility:
```javascript
return {
    ...getDefaultStore(),  // New fields with defaults
    ...parsed              // Existing user data
};
```
This ensures existing users don't lose data when new features are added.

### Common Patterns

**Refreshing a page after data changes:**
```javascript
import { refreshCurrentPage } from '../components/navigation.js';
// After saving data
refreshCurrentPage();  // Re-runs current view's init function
```

**Getting current training week:**
```javascript
import { getSettings } from '../data/storage.js';
import { getCurrentWeek, getTodayISO } from '../utils/date.js';

const settings = getSettings();
const today = getTodayISO();
const currentWeek = getCurrentWeek(today, settings.trainingPlanStart);
```

**Formatting pace/time:**
```javascript
import { formatPace, formatDuration } from '../utils/pace.js';

formatPace(360);        // "6:00 /km"
formatDuration(3665);   // "1:01:05"
```

**Editing runs via temporary localStorage flag:**
```javascript
// In dashboard.js - when Edit button is clicked
localStorage.setItem('editingRunId', runId);
window.location.hash = 'log-run';

// In logRun.js - on init
const editingRunId = localStorage.getItem('editingRunId');
if (editingRunId) {
    const run = getRun(editingRunId);
    populateFormWithRun(run);
    form.dataset.editingRunId = editingRunId;
}
localStorage.removeItem('editingRunId'); // Clean up immediately
```
This pattern uses temporary localStorage to pass state between views without polluting the URL or requiring a state management library.

**Form modes (create vs edit):**
The log-run form supports both creating new runs and editing existing ones. Mode is determined by the `editingRunId` in localStorage:
- Create mode: `form.reset()`, button shows "Log Run"
- Edit mode: `populateFormWithRun()`, button shows "Update Run", `form.dataset.editingRunId` stores the ID

When saving, check for `form.dataset.editingRunId` to determine if this is an update.

**Preventing memory leaks in view init functions:**
```javascript
// Always remove old listeners before adding new ones
button.removeEventListener('click', handleClick);
button.addEventListener('click', handleClick);
```
This prevents duplicate listeners when navigating back to the same view multiple times. See dashboard.js:317-324 and logRun.js:56-59.

**Debouncing user input:**
```javascript
// logRun.js uses debouncing for live pace calculation
let timeout = null;
function debouncedUpdate() {
    clearTimeout(timeout);
    timeout = setTimeout(updatePaceCalculation, 300);
}
```
Prevents excessive calculations during rapid input changes.

## Security

**XSS Prevention:** User-generated content (run notes) is HTML-escaped before rendering:
```javascript
// dashboard.js:210
const safeNotes = run.notes ? run.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
```
Always escape user input when inserting into innerHTML.

**localStorage Quota Handling:** storage.js catches QuotaExceededError and prompts user to export data:
```javascript
// storage.js:66-68
if (e.name === 'QuotaExceededError') {
    alert('Storage quota exceeded. Please export your data and clear old entries.');
}
```

## Chart.js Integration

Uses Chart.js v4.4.1 (loaded via CDN in index.html:314). This specific version is pinned for stability. Charts are rendered in `<canvas>` elements and initialized when the view loads.

**Important:** Destroy existing chart instances before creating new ones to avoid memory leaks:
```javascript
if (chartInstance) {
    chartInstance.destroy();
}
chartInstance = new Chart(ctx, config);
```

## Testing

**Manual testing:** Open DevTools Console to:
- View localStorage: `localStorage.getItem('runningDashboard')`
- Clear data: `localStorage.clear()` then refresh
- Check for errors in Console tab

**Test different weeks:** Change `trainingPlanStart` in storage to move the current week:
```javascript
// In DevTools Console
const data = JSON.parse(localStorage.getItem('runningDashboard'));
data.settings.trainingPlanStart = '2026-03-01';  // Move to a different date
localStorage.setItem('runningDashboard', JSON.stringify(data));
location.reload();
```

## Common Gotchas

- **Dates are ISO strings:** Always use `parseDate()` from `date.js` to avoid timezone issues
- **Time is stored in seconds:** Convert user input (MM:SS or HH:MM:SS) to seconds before storage
- **Week numbers are 1-indexed:** Week 1 starts on `trainingPlanStart`, not week 0
- **ES6 modules require server:** File paths must be served over HTTP(S) for imports to work
- **Chart.js must be loaded:** Check Network tab if charts don't render (CDN may be blocked)

## Data Export/Import

**UI-based export/import:** The dashboard page includes export/import buttons (dashboard.js:309-435):
- Export creates a timestamped JSON file download
- Import validates structure before replacing data
- Both operations include user confirmations for safety

**Manual via DevTools Console:**

**Export:**
```javascript
const data = localStorage.getItem('runningDashboard');
console.log(data);  // Copy this JSON
```

**Import:**
```javascript
localStorage.setItem('runningDashboard', 'YOUR_JSON_HERE');
location.reload();
```
