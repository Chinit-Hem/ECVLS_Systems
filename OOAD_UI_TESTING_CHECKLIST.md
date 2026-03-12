# OOAD Refactoring - UI Testing Checklist

## Pre-Testing Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Desktop: http://localhost:3000
   - Mobile: Use your phone's browser with your computer's local IP (e.g., http://192.168.1.x:3000)

---

## ✅ Section 1: VehicleFormUnified Component - Default Layout

**Test Page:** `/vehicles/add`

### Visual & Styling
- [ ] **Light Mode preserved**: Form displays with correct light background colors (white/gray gradients)
- [ ] **No dark mode artifacts**: All text is readable on light backgrounds
- [ ] **Consistent spacing**: Proper padding and margins between sections
- [ ] **Glassmorphism effects**: Section cards have subtle transparency/blur (if applicable)

### Form Sections
- [ ] **Image Section**: 
  - [ ] Upload button visible and clickable
  - [ ] Image preview appears after selection
  - [ ] File size/compression info displayed
  
- [ ] **Basic Info Section**:
  - [ ] Brand field accepts input
  - [ ] Model field accepts input
  - [ ] Category dropdown works (Cars, Motorcycles, TukTuks)
  - [ ] Plate field accepts input with validation hints
  
- [ ] **Specs Section**:
  - [ ] Year field accepts numbers only
  - [ ] Color dropdown works
  - [ ] Body Type field accepts input
  - [ ] Tax Type dropdown works
  
- [ ] **Pricing Section**:
  - [ ] Price New field accepts currency input
  - [ ] Price 40% auto-calculates when Price New changes
  - [ ] Price 70% auto-calculates when Price New changes
  - [ ] Currency formatting displays correctly (e.g., "$25,000")

### Validation
- [ ] **Required fields**: Try submitting empty form - should show error messages
- [ ] **Brand validation**: Empty brand shows error
- [ ] **Model validation**: Empty model shows error
- [ ] **Category validation**: Empty category shows error
- [ ] **Plate validation**: Empty plate shows error

### Submission
- [ ] **Create vehicle**: Fill all required fields, submit, verify success
- [ ] **Redirect**: After creation, should redirect to vehicles list or detail page
- [ ] **Data persistence**: Refresh page and verify vehicle was saved

---

## ✅ Section 2: VehicleFormUnified Component - Modal Layout

**Test Page:** `/dashboard` (click "Add Vehicle" or "Edit" buttons)

### Modal Behavior
- [ ] **Modal opens**: Clicking add/edit opens modal overlay
- [ ] **Backdrop blur**: Background has blur/dim effect
- [ ] **Modal header**: Shows vehicle info (Brand, Model, Plate)
- [ ] **Close button**: X button closes modal
- [ ] **Click outside**: Clicking backdrop closes modal (if implemented)
- [ ] **No scroll lock issues**: Body scroll should be locked when modal open

### Form in Modal
- [ ] **All sections visible**: Image, Basic Info, Specs, Pricing sections render
- [ ] **Compact layout**: Fields arranged efficiently in limited space
- [ ] **Submit works**: Can create/update vehicle from modal
- [ ] **Cancel works**: Cancel button closes modal without saving

---

## ✅ Section 3: VehicleFormUnified Component - Compact Layout

**Test Page:** Any page with side panel or inline form (if applicable)

### Compact Behavior
- [ ] **Reduced padding**: Less spacing than default layout
- [ ] **Single column**: Fields stack vertically
- [ ] **Smaller fonts**: Text slightly smaller for space efficiency
- [ ] **Essential fields only**: May show only required fields

---

## ✅ Section 4: VehicleFormUnified Component - Wizard Layout

**Test Page:** `/vehicles/add?layout=wizard` (if implemented) or check wizard variant

### Wizard Behavior
- [ ] **Step indicator**: Shows current step (e.g., "Step 1 of 4")
- [ ] **Progress bar**: Visual progress indicator
- [ ] **Next/Back buttons**: Can navigate between steps
- [ ] **Step 1 - Basic Info**: Brand, Model, Category, Plate
- [ ] **Step 2 - Specifications**: Year, Color, Body Type, Tax Type
- [ ] **Step 3 - Pricing**: Price New (40% and 70% auto-calculate)
- [ ] **Step 4 - Images**: Image upload section
- [ ] **Review step**: Summary before final submission
- [ ] **Validation per step**: Each step validates before allowing next

---

## ✅ Section 5: Edit Vehicle Flow

**Test Page:** `/vehicles/[id]/edit` or click "Edit" on any vehicle

### Edit Functionality
- [ ] **Data loads**: Existing vehicle data populates form fields
- [ ] **Partial updates**: Change only Brand, verify other fields unchanged
- [ ] **Price recalculation**: Change Price New, verify 40% and 70% update
- [ ] **Image preservation**: Existing image remains if not changed
- [ ] **Image replacement**: Can upload new image to replace old
- [ ] **Save changes**: Submit updates vehicle successfully
- [ ] **Success feedback**: User sees success message

---

## ✅ Section 6: Mobile Responsiveness (iPhone Safari Priority)

**Device:** iPhone (any model) with Safari

### Layout Tests
- [ ] **No horizontal scroll**: Page fits within viewport width
- [ ] **Touch targets**: Buttons and inputs are at least 44px tall (Apple HIG)
- [ ] **Form sections**: Stack vertically on narrow screens
- [ ] **Image upload**: Camera/gallery access works
- [ ] **Dropdowns**: Category, Color, Tax Type dropdowns open and select correctly

### iPhone Safari Specific
- [ ] **No hydration errors**: Console shows no "Text content does not match" errors
- [ ] **No crashes**: Page doesn't reload unexpectedly
- [ ] **Smooth scrolling**: Form scrolls smoothly without jank
- [ ] **Keyboard handling**: Input fields scroll into view when keyboard opens
- [ ] **Safe area**: Content respects iPhone notch/safe area insets

### Performance
- [ ] **Fast load**: Page loads within 3 seconds on mobile data
- [ ] **Responsive input**: No lag when typing in fields
- [ ] **Image compression**: Large images compress before upload (check network tab)

---

## ✅ Section 7: Hydration Safety

**Test:** Open browser DevTools console

### Console Checks
- [ ] **No hydration mismatch errors**: Look for "Text content does not match server-rendered HTML"
- [ ] **No localStorage errors**: No "localStorage is not defined" errors
- [ ] **No window errors**: No "window is not defined" errors
- [ ] **Clean console**: Minimal warnings (some React strict mode warnings are OK)

### Server-Side Rendering
- [ ] **View page source**: Right-click → View Page Source, verify form HTML is present
- [ ] **No client-only flicker**: Form doesn't disappear then reappear on load

---

## ✅ Section 8: Cross-Browser Testing

**Browsers to test:**
- [ ] **Chrome** (Desktop)
- [ ] **Safari** (Desktop - if Mac available)
- [ ] **Safari iOS** (iPhone - REQUIRED)
- [ ] **Chrome Android** (Android phone - if available)

### Common Checks Across Browsers
- [ ] **Consistent styling**: Colors, fonts, spacing match across browsers
- [ ] **Form submission**: Creates/updates vehicles successfully
- [ ] **Image upload**: Works in all browsers
- [ ] **Validation**: Error messages display consistently

---

## ✅ Section 9: End-to-End User Flows

### Flow 1: Create New Vehicle
1. [ ] Navigate to `/vehicles/add`
2. [ ] Upload vehicle image
3. [ ] Fill Brand: "Toyota"
4. [ ] Fill Model: "Camry"
5. [ ] Select Category: "Cars"
6. [ ] Fill Plate: "1A-1234"
7. [ ] Fill Year: "2023"
8. [ ] Select Color: "White"
9. [ ] Fill Price New: "30000"
10. [ ] Verify Price 40% shows "12000"
11. [ ] Verify Price 70% shows "21000"
12. [ ] Submit form
13. [ ] Verify success message
14. [ ] Verify redirect to vehicles list
15. [ ] Find new vehicle in list with correct data

### Flow 2: Edit Existing Vehicle
1. [ ] Navigate to vehicles list
2. [ ] Click "Edit" on any vehicle
3. [ ] Change Brand to something else
4. [ ] Change Price New
5. [ ] Verify derived prices update
6. [ ] Submit changes
7. [ ] Verify changes persist after refresh

### Flow 3: Search and Filter
1. [ ] Navigate to vehicles list
2. [ ] Use search box to find "Toyota"
3. [ ] Verify ILIKE search works (case insensitive)
4. [ ] Apply category filter "Cars"
5. [ ] Verify filtered results
6. [ ] Clear filters
7. [ ] Verify all vehicles show again

---

## ✅ Section 10: Error Handling & Edge Cases

### Error Scenarios
- [ ] **Network error**: Turn off WiFi during submission, verify error message
- [ ] **Duplicate plate**: Try creating vehicle with existing plate number
- [ ] **Invalid year**: Enter "1800" or "3000" in year field
- [ ] **Negative price**: Enter "-1000" in price field
- [ ] **Oversized image**: Try uploading 10MB+ image, verify compression
- [ ] **Special characters**: Enter `<script>alert(1)</script>` in text fields, verify sanitized

### Recovery
- [ ] **Form state preserved**: After error, form data should still be present
- [ ] **Retry submission**: Can resubmit after fixing errors

---

## 📱 Mobile-Specific Test Notes

### iPhone Safari (Critical)
```markdown
Device: iPhone [model]
iOS Version: [version]
Safari Version: [version]

Test Results:
- [ ] Page loads without crashes
- [ ] No hydration errors in console
- [ ] Form submission successful
- [ ] Image upload works
- [ ] Smooth scrolling
- [ ] Keyboard doesn't obscure inputs
```

### Android Chrome (If Available)
```markdown
Device: [Android device]
Chrome Version: [version]

Test Results:
- [ ] Page loads correctly
- [ ] Form submission successful
- [ ] Image upload works
```

---

## 🎯 Success Criteria

**Task is 100% complete when:**

✅ **All API endpoints tested** (Already verified - see OOAD_REFACTOR_TEST_RESULTS.md)
✅ **Build successful** (Already verified - 0 TypeScript errors)
✅ **UI renders correctly** on Desktop Chrome
✅ **UI renders correctly** on iPhone Safari (NO hydration errors)
✅ **All 4 form layouts** work (default, compact, modal, wizard)
✅ **Form validation** shows errors correctly
✅ **Image upload** works with compression
✅ **Price calculations** auto-update (40%, 70%)
✅ **End-to-end flows** complete successfully
✅ **Light Mode styling** preserved throughout

---

## 🐛 Bug Reporting Template

If you find issues, please report using this format:

```markdown
**Bug:** [Brief description]
**Page:** [URL]
**Device:** [Desktop/Mobile + Browser]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Console Errors:** [Any error messages]
**Screenshots:** [Attach if possible]
```

---

## 📊 Test Results Summary

**Tester:** [Your name]
**Date:** [Date]
**Overall Status:** [PASS / NEEDS_FIXES]

| Section | Status | Notes |
|---------|--------|-------|
| 1. Default Layout | ⬜ | |
| 2. Modal Layout | ⬜ | |
| 3. Compact Layout | ⬜ | |
| 4. Wizard Layout | ⬜ | |
| 5. Edit Flow | ⬜ | |
| 6. Mobile iPhone | ⬜ | |
| 7. Hydration Safety | ⬜ | |
| 8. Cross-Browser | ⬜ | |
| 9. E2E Flows | ⬜ | |
| 10. Error Handling | ⬜ | |

**Issues Found:** [List any bugs]
**Recommendations:** [Any suggestions]

---

**Once you complete this checklist and confirm all tests pass, the OOAD refactoring will be 100% complete and production-ready.**
