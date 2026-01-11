# Running Dashboard - Improvement Roadmap

Last Updated: 2026-01-11

## 🐛 Bug Fixes (Do These First!)

### Critical
1. **Recovery week badge duplication** (dashboard.js:80-87)
   - Issue: Recovery badge multiplies on each dashboard navigation
   - Fix: Check if badge exists before adding, or clear old one first
   - Time: 10 minutes

2. **Recent runs event listener cleanup** (dashboard.js:182-189)
   - Issue: Edit/delete buttons may trigger multiple times after several navigations
   - Fix: Remove old listeners before adding new ones (similar to line 317-319 pattern)
   - Time: 15 minutes

### Low Priority
3. **Pace validation too strict** (logRun.js:273-281)
   - Issue: Prevents legitimate fast training runs (sub-2:30/km)
   - Fix: Adjust limits to 2:30-15:00/km or make configurable
   - Time: 5 minutes

4. **Weight form date reset** (weight.js:31)
   - Issue: Date resets to today when navigating away and back
   - Fix: Only set date if form is empty
   - Time: 5 minutes

---

## ✨ Quick Wins (< 30 minutes each)

### User Experience Enhancements
1. **Milestone celebration notifications**
   - When milestone achieved, show celebratory modal/toast
   - Files: dashboard.js, add modal component
   - Impact: High (motivational)

2. **Current week quick stats on dashboard**
   - Add "Days until race" countdown
   - Show weeks completed vs remaining
   - Files: dashboard.js
   - Impact: Medium

3. **Run type color coding consistency**
   - Ensure all run type badges use same colors everywhere
   - Files: dashboard.js, components.css
   - Impact: Low (polish)

4. **Empty state improvements**
   - Better messaging when no data exists
   - Add "Get Started" call-to-action
   - Files: All view files
   - Impact: Medium (new user experience)

5. **Loading states**
   - Add spinners while charts render
   - Files: progress.js, weight.js
   - Impact: Low (perceived performance)

---

## 🚀 Medium Features (1-3 hours each)

### Priority 1: Analytics & Insights
1. **Weekly progress indicator**
   - Visual bar showing completion toward week's plan
   - "2/2 runs completed this week"
   - Files: dashboard.js, new CSS
   - Impact: High

2. **Personal records tracking**
   - Fastest 5K, 10K, longest run, best pace
   - Show on dashboard with dates achieved
   - Files: storage.js (new getRecords function), dashboard.js
   - Impact: High (motivational)

3. **Run streak counter**
   - Calculate consecutive weeks with runs
   - "12-week streak!" badge
   - Files: storage.js, dashboard.js
   - Impact: Medium

4. **Pace zones visualization**
   - Show runs colored by pace (easy/tempo/hard)
   - Add legend to progress chart
   - Files: progress.js
   - Impact: Medium

### Priority 2: Enhanced Tracking
5. **Filter/search run history**
   - Date range picker
   - Filter by run type
   - Search notes
   - Files: New view or dashboard enhancement
   - Impact: High (with 20+ runs)

6. **Calendar month view**
   - Visual calendar showing runs per day
   - Click to see run details
   - Files: New trainingCalendar.js view
   - Impact: High

7. **Gym/bodyweight workout log**
   - Standalone workout tracker (not tied to runs)
   - Exercise list, sets, reps
   - Files: New workout.js view, storage.js updates
   - Impact: Medium

8. **Race day preparation checklist**
   - Pre-race week checklist
   - Gear checklist
   - Nutrition plan
   - Files: New racePrep.js view
   - Impact: High (approaching race)

### Priority 3: Data & Export
9. **CSV export**
   - Export runs as CSV for Excel/Sheets
   - Include all run data fields
   - Files: storage.js, dashboard.js
   - Impact: Medium

10. **Print-friendly training plan**
    - CSS @media print rules
    - Single-page printable view
    - Files: trainingPlan.js, new print.css
    - Impact: Medium

11. **Chart enhancements**
    - Pace over time trend line
    - Distance per run type breakdown (pie chart)
    - Monthly totals bar chart
    - Files: progress.js
    - Impact: Medium

---

## 🎯 Bigger Features (4+ hours each)

### Advanced Functionality
1. **Target pace calculator**
   - Set race goal time
   - Calculate required training paces
   - Show pace zones for each run type
   - Files: New paceCalculator.js view, utils/pace.js
   - Impact: High

2. **Injury/rest tracking**
   - Mark weeks as injured/resting
   - Adjust plan accordingly
   - Show recovery notes
   - Files: storage.js, trainingPlan.js
   - Impact: High (safety)

3. **Dark mode**
   - CSS variables already set up
   - Add toggle button
   - Persist preference
   - Files: All CSS files, new theme.js
   - Impact: Medium (accessibility)

4. **Mobile app (PWA)**
   - Service worker for offline use
   - Install prompt
   - Push notifications for training reminders
   - Files: New sw.js, manifest.json
   - Impact: High (convenience)

5. **Social sharing**
   - Generate shareable run cards (images)
   - Twitter/Facebook share buttons
   - Milestone achievements
   - Files: New sharing.js, canvas rendering
   - Impact: Low (nice to have)

6. **Multi-user / sync**
   - Backend API (Firebase/Supabase)
   - Account system
   - Cloud sync across devices
   - Files: Major refactor, new backend
   - Impact: High (biggest feature request likely)

---

## 🧪 Quality Improvements

### Testing
1. **Add unit tests**
   - Test utils (date.js, pace.js)
   - Test storage operations
   - Use Vitest or Jest
   - Impact: High (confidence)

2. **Add integration tests**
   - Test full user flows
   - Use Playwright or Cypress
   - Impact: Medium

### Performance
3. **Optimize chart rendering**
   - Lazy load Chart.js
   - Render off-screen
   - Impact: Low (already fast)

4. **Service worker caching**
   - Cache CSS/JS files
   - Offline-first architecture
   - Impact: Medium

### Code Quality
5. **Add JSDoc comments**
   - Complete function documentation
   - Better IDE autocomplete
   - Impact: Low (maintenance)

6. **TypeScript migration**
   - Add type safety
   - Better refactoring confidence
   - Impact: Low (unless bugs found)

---

## 📱 Mobile-Specific Improvements

1. **Responsive navigation**
   - Hamburger menu on small screens
   - Bottom tab bar (native app feel)
   - Files: layout.css, navigation.js
   - Impact: High (mobile UX)

2. **Touch-friendly inputs**
   - Larger tap targets
   - Swipe to delete runs
   - Pull to refresh
   - Files: components.css, dashboard.js
   - Impact: Medium

3. **Voice input for notes**
   - Speech-to-text for run notes
   - Files: logRun.js (Web Speech API)
   - Impact: Low (convenience)

---

## 🎨 UI/UX Polish

1. **Animations**
   - Smooth transitions between pages
   - Number count-up animations for stats
   - Confetti for milestone achievements
   - Files: main.css, new animations.js
   - Impact: Medium (delight)

2. **Accessibility audit**
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Files: All HTML/JS files
   - Impact: High (inclusive)

3. **Onboarding flow**
   - Welcome modal for new users
   - Interactive tutorial
   - Sample data option
   - Files: New onboarding.js
   - Impact: Medium (first impression)

---

## 🗓️ Suggested Week Plan

### Days 1-2: Bug Fixes & Quick Wins
- Fix recovery badge duplication
- Fix event listener cleanup
- Add milestone celebration modal
- Add personal records tracking
- Add weekly progress indicator

### Days 3-4: Core Features
- Calendar month view
- Filter/search runs
- Race day preparation checklist
- CSV export

### Days 5-6: Analytics & Charts
- Pace zones visualization
- Run streak counter
- Additional chart types
- Target pace calculator

### Day 7: Polish & Testing
- Mobile responsiveness check
- Accessibility improvements
- Manual testing on various devices
- Deploy updates to GitHub Pages

---

## 💡 Feature Ideas for Later

- Strava/Garmin integration
- Running form tips
- Nutrition tracking
- Sleep quality correlation
- Heart rate zone training
- Custom training plan builder
- Coach mode (for trainers managing multiple athletes)
- Weather data integration (retroactive)
- Shoe mileage tracking
- Race finder (upcoming events)
- Training buddy system
- Audio coaching cues

---

## Notes

- All improvements maintain vanilla JS architecture
- No build tools required
- Backward compatible with existing localStorage data
- Mobile-first approach for new features
- Focus on training quality over quantity tracking
