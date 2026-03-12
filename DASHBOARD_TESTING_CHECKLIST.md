# Dashboard Fixes - Manual Testing Checklist

## Pre-Testing Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache** to ensure fresh data:
   - Open DevTools (F12)
   - Go to Application/Storage tab
   - Click "Clear site data" or "Clear storage"
   - Refresh the page (Ctrl+Shift+R for hard refresh)

3. **Access the application:**
   - Desktop: http://localhost:3000
   - Mobile: Use your phone's browser with your computer's local IP

---

## ✅ Section 1: Dashboard Category Counts (CRITICAL)

**Test Page:** http://localhost:3000 (Dashboard)

### 1.1 Verify KPI Cards Display Correct Counts

**Expected:** With 1,192 total vehicles, you should see non-zero values for:
- Cars
- Motorcycles  
- Tuk Tuk

**Steps:**
1. [ ] Open dashboard and wait for data to load (may take 2-3 seconds)
2. [ ] Look at the KPI cards row (7 cards: Total, Cars, Motorcycles, Tuk Tuk, New, Used, No Images)
3. [ ] **Total card**: Should show **1,192** (or close to it)
4. [ ] **Cars card**: Should show actual count (NOT 0)
5. [ ] **Motorcycles card**: Should show actual count (NOT 0)
6. [ ] **Tuk Tuk card**: Should show actual count (NOT 0)

**If counts are still 0:**
- Check browser console for errors
- Click "Refresh" button and wait
- Check Network tab for `/api/vehicles` response

### 1.2 Test Category Filter Click

**Steps:**
1. [ ] Click on **"Cars"** KPI card
2. [ ] Should navigate to `/vehicles?category=car`
3. [ ] Vehicles list should filter to show only Cars
4. [ ] Count should match the KPI card number

5. [ ] Go back to dashboard
6. [ ] Click on **"Motorcycles"** KPI card
7. [ ] Should navigate to `/vehicles?category=motorcycle`
8. [ ] Vehicles list should filter to show only Motorcycles

9. [ ] Go back to dashboard
10. [ ] Click on **"Tuk Tuk"** KPI card
11. [ ] Should navigate to `/vehicles?category=tuk%20tuk`
12. [ ] Vehicles list should filter to show only Tuk Tuks

### 1.3 Verify Data Consistency

**Steps:**
1. [ ] Note the count from Cars KPI card
2. [ ] Click it and count vehicles in the list
3. [ ] Numbers should match (±1 for pagination differences)

4. [ ] Repeat for Motorcycles
5. [ ] Repeat for Tuk Tuks

### 1.4 Test After Refresh

**Steps:**
1. [ ] Refresh the dashboard page (F5)
2. [ ] Verify counts still display correctly
3. [ ] Check that "Last updated" timestamp updates

---

## ✅ Section 2: ImageInput Component Testing

### 2.1 Integration Setup

**Add ImageInput to a test page or existing form:**

```tsx
// Add this import to your vehicle form component
import { ImageInput } from "@/app/components/ui/ImageInput";

// Add this state
const [testImage, setTestImage] = useState<string | null>(null);

// Add this to your form JSX
<ImageInput
  value={testImage}
  onChange={setTestImage}
  label="Test Vehicle Image"
  maxSizeMB={5}
/>
```

**Or create a quick test page** at `src/app/test-image-input/page.tsx`:

```tsx
"use client";

import { ImageInput } from "@/app/components/ui/ImageInput";
import { useState } from "react";

export default function TestImageInput() {
  const [image, setImage] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">ImageInput Test</h1>
      <ImageInput
        value={image}
        onChange={setImage}
        label="Vehicle Image"
        maxSizeMB={5}
      />
      {image && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm font-mono break-all">{image.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
}
```

Then visit: http://localhost:3000/test-image-input

### 2.2 File Upload - Click to Select

**Steps:**
1. [ ] Click on the upload area (dashed border box)
2. [ ] File picker dialog should open
3. [ ] Select a valid image file (JPG, PNG, GIF)
4. [ ] Image preview should appear in the upload area
5. [ ] File name and size should display below image
6. [ ] Remove button (X) should appear in top-right corner

**Test with different file types:**
- [ ] JPG image
- [ ] PNG image
- [ ] GIF image
- [ ] WebP image (if available)

### 2.3 File Upload - Drag & Drop

**Steps:**
1. [ ] Open file explorer/finder with images
2. [ ] Drag an image file onto the upload area
3. [ ] Upload area should highlight (green/emerald border) while dragging
4. [ ] Drop the file
5. [ ] Image preview should appear
6. [ ] File name and size should display

**Test edge cases:**
- [ ] Drag multiple files (only first should be used)
- [ ] Drag non-image file (should show error)
- [ ] Drag oversized file (10MB+) - should show error

### 2.4 URL Input - Manual Entry

**Steps:**
1. [ ] Clear any existing image (click X if present)
2. [ ] Type a valid image URL in the text field:
   - Example: `https://via.placeholder.com/300x200.png`
   - Or any direct image URL from the web
3. [ ] Click "Add" button
4. [ ] Image should load and display preview
5. [ ] "Image from URL" text should appear below

**Test invalid URLs:**
- [ ] Enter `not-a-url` - should show error
- [ ] Enter `https://example.com/not-an-image` - should show error
- [ ] Enter `https://example.com/fake.jpg` (404 image) - should show error

### 2.5 URL Input - Ctrl+V Paste (KEY FEATURE)

**Steps:**
1. [ ] Clear any existing image
2. [ ] Copy an image URL to clipboard (Ctrl+C)
   - Example: `https://via.placeholder.com/400x300.jpg`
3. [ ] Click anywhere on the page (not in the URL input)
4. [ ] Press Ctrl+V (or Cmd+V on Mac)
5. [ ] Image should automatically load and display!

**Test scenarios:**
- [ ] Paste while focused in URL input (should work normally)
- [ ] Paste while focused elsewhere on page (should trigger upload)
- [ ] Paste invalid URL (should show error)

### 2.6 Image Preview & Removal

**Steps:**
1. [ ] Upload or paste any image
2. [ ] Verify preview displays correctly
3. [ ] Click the X (remove) button in top-right
4. [ ] Image should be removed
5. [ ] Upload area should return to empty state
6. [ ] URL input field should reappear

### 2.7 File Size Validation

**Steps:**
1. [ ] Try to upload a large image (>5MB)
   - You can create one at: https://www.mockaroo.com/ or use any large photo
2. [ ] Should show error: "File size must be less than 5MB"
3. [ ] Try to upload a 4.9MB image
4. [ ] Should succeed

**Test with different maxSizeMB:**
```tsx
<ImageInput
  value={image}
  onChange={setImage}
  maxSizeMB={10}  // Test with 10MB limit
/>
```

### 2.8 Error Handling

**Steps:**
1. [ ] Try uploading a non-image file (PDF, TXT)
   - Should show: "Please upload an image file"
2. [ ] Try an invalid URL
   - Should show: "Failed to load image from URL" or "Please enter a valid image URL"
3. [ ] Verify error messages are clear and helpful
4. [ ] Verify errors disappear when you fix the issue

---

## ✅ Section 3: Mobile Testing (iPhone Safari - CRITICAL)

### 3.1 Dashboard on iPhone

**Steps:**
1. [ ] Open Safari on iPhone
2. [ ] Navigate to your local IP (e.g., http://192.168.1.x:3000)
3. [ ] Wait for dashboard to load
4. [ ] **Check for crashes**: Page should not reload unexpectedly
5. [ ] **Check console**: No "Text content does not match" hydration errors
6. [ ] Verify KPI cards show correct counts (not 0)

### 3.2 ImageInput on iPhone

**Steps:**
1. [ ] Navigate to test page with ImageInput
2. [ ] **Tap upload area**: Should open photo picker
3. [ ] **Select from Photos**: Choose an image from camera roll
4. [ ] Image should upload and preview
5. [ ] **Test camera access**: Tap upload → Take Photo → Take picture → Use Photo
6. [ ] **Test URL paste**: 
   - Copy an image URL
   - Tap in URL input field
   - Paste (should work normally)
7. [ ] **Test Ctrl+V equivalent**: 
   - Copy image URL
   - Tap anywhere on page
   - Try to paste (may not work on mobile, that's OK)

### 3.3 Hydration Safety Check

**Steps:**
1. [ ] Open DevTools on desktop (for debugging mobile)
2. [ ] Connect iPhone and enable remote debugging
3. [ ] Check Console for any hydration mismatch errors
4. [ ] Should see NO errors like:
   - "Text content does not match server-rendered HTML"
   - "Hydration failed"
   - "There was an error while hydrating"

---

## ✅ Section 4: Integration with Existing Forms

### 4.1 Replace Existing Image Input

**In your vehicle form (e.g., VehicleFormUnified or VehicleModal):**

1. [ ] Find the existing image input component
2. [ ] Replace with:
```tsx
<ImageInput
  value={vehicle.Image}
  onChange={(url) => setVehicle({ ...vehicle, Image: url })}
  label="Vehicle Image"
  maxSizeMB={5}
  helperText="Upload photo or paste image URL"
/>
```

3. [ ] Test the form submission
4. [ ] Verify image URL is saved correctly
5. [ ] Verify image displays in vehicle list/detail views

### 4.2 Test with Real Data

**Steps:**
1. [ ] Create a new vehicle with ImageInput
2. [ ] Use file upload method
3. [ ] Save vehicle
4. [ ] Verify image appears in vehicle list
5. [ ] Edit the vehicle
6. [ ] Change to URL method
7. [ ] Save again
8. [ ] Verify image updates

---

## 📊 Test Results Summary

**Tester:** [Your name]  
**Date:** [Date]  
**Device:** [Desktop/Mobile model]  
**Browser:** [Chrome/Safari/Firefox version]

### Dashboard Category Counts
| Test | Status | Notes |
|------|--------|-------|
| Total shows 1,192 | ⬜ | |
| Cars count > 0 | ⬜ | Actual: ___ |
| Motorcycles count > 0 | ⬜ | Actual: ___ |
| Tuk Tuks count > 0 | ⬜ | Actual: ___ |
| Click filters work | ⬜ | |
| Refresh preserves counts | ⬜ | |

### ImageInput Component
| Test | Status | Notes |
|------|--------|-------|
| Click to upload | ⬜ | |
| Drag & drop | ⬜ | |
| URL input | ⬜ | |
| Ctrl+V paste | ⬜ | |
| Image preview | ⬜ | |
| Remove button | ⬜ | |
| File size validation | ⬜ | |
| Error handling | ⬜ | |

### Mobile (iPhone Safari)
| Test | Status | Notes |
|------|--------|-------|
| No hydration errors | ⬜ | |
| No crashes | ⬜ | |
| Touch upload works | ⬜ | |
| Camera access works | ⬜ | |
| Smooth scrolling | ⬜ | |

---

## 🐛 Bug Reporting

If you find issues, please report with:

```markdown
**Issue:** [Brief description]
**Page:** [URL]
**Device:** [Desktop/Mobile]
**Steps:**
1. [Step 1]
2. [Step 2]

**Expected:** [What should happen]
**Actual:** [What happens]
**Console Errors:** [Copy any errors]
**Screenshot:** [Attach if possible]
```

---

## 🎯 Success Criteria

**Task is complete when:**

✅ Dashboard shows correct category counts (not 0)  
✅ Cars/Motorcycles/TukTuks all display actual numbers  
✅ Clicking KPI cards filters vehicles correctly  
✅ ImageInput component renders without hydration errors  
✅ File upload (click & drag-drop) works  
✅ URL input and Ctrl+V paste works  
✅ Image preview and removal works  
✅ Error handling shows clear messages  
✅ iPhone Safari: No crashes, no hydration errors  
✅ Light Mode styling preserved  

---

**Once you've completed this checklist and all tests pass, the dashboard fixes are 100% complete!**
