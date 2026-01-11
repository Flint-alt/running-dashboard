# Running Training Dashboard

A web-based training dashboard to track your progress toward a half marathon goal in November 2026.

## Overview

This is a learning project built with **vanilla JavaScript, HTML, and CSS** - no frameworks, no build tools. Just open `index.html` in your browser and start training!

**Training Plan:**
- 44 weeks total (Jan 5, 2026 - Nov 8, 2026)
- Milestone goals: 10k (March), 15k (June), 20k (September), Half Marathon (November)
- Starting weight: 74.5kg → Goal: 65kg

## Features

✅ **Training Plan View** - Complete 44-week schedule with phases and milestones
✅ **Log Runs** - Record distance, time, pace (auto-calculated), and notes
✅ **Dashboard** - Current week, recent runs, weight progress, next milestone
✅ **Progress Tracking** - Charts and statistics for your training journey
✅ **Weight Tracking** - Log weight with trend visualization
✅ **Data Persistence** - Everything saves to localStorage (no server needed)

## Getting Started

### Option 1: Open directly in browser
1. Double-click `index.html` to open in your default browser
2. Start logging runs!

### Option 2: Use a local server (recommended)
```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

## How to Use

### 1. Log Your First Run
- Click **"Log Run"** in the navigation
- Enter date (defaults to today)
- Select run type (parkrun, long run, easy, etc.)
- Enter distance in km
- Enter time as `MM:SS` or `HH:MM:SS`
- Pace is calculated automatically!
- Add optional notes
- Check gym/bodyweight boxes if completed
- Click **"Log Run"**

### 2. View Your Progress
- **Dashboard** - See your current week, recent runs, and weight progress
- **Training Plan** - View all 44 weeks with planned distances
- **Progress** - Charts showing weekly mileage (planned vs actual)
- **Weight** - Log and track weight toward your 65kg goal

### 3. Track Milestones
The app automatically tracks when you achieve:
- First 10K (Week 9)
- First 15K (Week 23)
- First 20K (Week 35)
- Half Marathon (Week 44)

## Project Structure

```
running-dashboard/
├── index.html              # Main page (open this!)
├── css/
│   ├── main.css           # Global styles and variables
│   ├── layout.css         # Layouts and responsive design
│   └── components.css     # Buttons, forms, cards
├── js/
│   ├── app.js            # Main initialization
│   ├── data/
│   │   ├── storage.js        # localStorage operations
│   │   └── trainingPlan.js   # 44-week plan data
│   ├── views/
│   │   ├── dashboard.js      # Dashboard page
│   │   ├── logRun.js         # Run logging form
│   │   ├── progress.js       # Progress charts
│   │   ├── trainingPlan.js   # Training plan view
│   │   └── weight.js         # Weight tracking
│   ├── components/
│   │   └── navigation.js     # Page routing
│   └── utils/
│       ├── date.js           # Date calculations
│       └── pace.js           # Pace/time calculations
└── README.md
```

## Learning Notes

### Key Concepts Demonstrated

**1. localStorage API**
- See `js/data/storage.js` for all data persistence
- Data structure: `{ runs: [], weights: [], settings: {}, milestones: {} }`
- Try opening DevTools → Application → localStorage to see your data!

**2. Date Handling**
- All dates stored as ISO strings (YYYY-MM-DD)
- Week calculations in `js/utils/date.js`
- Training week is calculated from plan start date (Jan 5, 2026)

**3. Pace Calculations**
- Pace = time / distance (in seconds per km)
- See `js/utils/pace.js` for all calculations
- Handles various time formats: "30:00", "1:30:45"

**4. ES6 Modules**
- Each file exports functions: `export function myFunction() {}`
- Import where needed: `import { myFunction } from './file.js'`
- Benefits: organized code, clear dependencies

**5. Single-Page Application (SPA)**
- Hash-based routing (#dashboard, #log-run, etc.)
- Show/hide sections with CSS classes
- See `js/components/navigation.js`

**6. Chart.js Integration**
- Weight trend chart with goal line
- Weekly mileage comparison (planned vs actual)
- Loaded via CDN in index.html

## Data Management

### Export Your Data
Currently manual:
1. Open DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('runningDashboard')`
4. Copy the JSON output
5. Save to a file for backup

### Import Data
1. Open DevTools Console
2. Paste: `localStorage.setItem('runningDashboard', 'YOUR_JSON_HERE')`
3. Refresh the page

(Note: Future enhancement will add Export/Import buttons in the UI)

### Clear All Data
1. Open DevTools Console
2. Type: `localStorage.clear()`
3. Refresh page for fresh start

## Customization

### Change Training Plan Start Date
Edit `js/data/storage.js`:
```javascript
trainingPlanStart: '2026-01-05'  // Change to your start date (Monday recommended)
```

### Change Goal Weight
Edit `js/data/storage.js`:
```javascript
goalWeight: 65  // Change to your target weight
```

### Modify Training Plan
Edit `js/data/trainingPlan.js`:
```javascript
export const WEEKLY_PLAN = [
    { week: 1, longRun: 7, parkrun: 5, isRecovery: false },
    // Modify distances as needed
];
```

## Browser Compatibility

Tested on:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires:
- ES6 module support (all modern browsers)
- localStorage (5-10MB limit)

## Future Enhancements

Ideas for when you're ready to expand:
- [ ] Export/Import UI buttons
- [ ] Edit/Delete run functionality
- [ ] Calendar view of runs
- [ ] Streak tracking
- [ ] Target pace ranges (parkrun: 6:00-6:24/km, long: 8:00-8:30/km)
- [ ] Dark mode
- [ ] PWA (installable as mobile app)
- [ ] **Migrate to React** (great next learning step!)

## Troubleshooting

**Problem:** Page is blank
- **Solution:** Check DevTools Console for errors. Make sure you're loading via http:// (not file://) for modules to work properly.

**Problem:** Pace shows '-' or 'Invalid'
- **Solution:** Make sure distance > 0 and time is in format MM:SS or HH:MM:SS

**Problem:** Current week is wrong
- **Solution:** Check that training plan start date is set correctly (Jan 5, 2026 = Week 1)

**Problem:** Charts don't show
- **Solution:** Check that Chart.js CDN loaded. Look in DevTools Network tab for failed requests.

## Learning Path

Now that you've built this with vanilla JavaScript:

1. ✅ **Master the basics** - You've learned:
   - DOM manipulation
   - localStorage
   - Date/time handling
   - ES6 modules
   - Single-page app routing

2. **Next steps:**
   - Add more features (edit runs, streaks, etc.)
   - Improve error handling
   - Add more charts and visualizations

3. **React migration:**
   - When ready, rebuild this same app in React
   - Compare the code side-by-side
   - See what problems React solves
   - Understand when frameworks are useful

## Resources

- **localStorage:** [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **Chart.js:** [Official Docs](https://www.chartjs.org/docs/latest/)
- **ES6 Modules:** [MDN Import/Export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- **Date handling:** [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

## Your Training Plan

**Phase 1 (Weeks 1-12):** Build to 10k
**Phase 2 (Weeks 13-24):** Extend to 15k
**Phase 3 (Weeks 25-36):** Build to 20k
**Phase 4 (Weeks 37-44):** Race prep & taper

Recovery week every 4th week. Parkrun (5k) every Saturday, progressive long run on Sunday.

---

**Good luck with your training! 🏃💪**

*Built as a learning project - keep it simple, stay consistent, reach your goals!*
