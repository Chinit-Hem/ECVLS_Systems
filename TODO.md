# VMS Dashboard Professional Standards Update

## Tasks

### 1. Chart Logic - Normalize Brand Names to Uppercase
- [x] Update `src/app/components/dashboard/Dashboard.tsx`
  - Normalize brand names to uppercase in the `aggregatedStats` useMemo

### 2. Mobile UI Fix - VehicleList Cards
- [x] Update `src/app/components/VehicleList.tsx`
  - Increase horizontal padding on mobile cards (px-6 py-4)
  - Increase border-radius on vehicle cards (rounded-2xl)

### 3. Navigation - Clickable "without images" Count
- [x] Update `src/app/components/dashboard/Dashboard.tsx`
  - Make the "without images" subtitle clickable
  - Navigate to `/vehicles?withoutImage=true`

### 4. Standard Colors - Consistent Color Palette
- [x] Create `src/lib/categoryColors.ts` (centralized color definitions)
- [x] Update `src/app/components/dashboard/Dashboard.tsx` to use centralized colors
- [x] Update `src/app/components/dashboard/DashboardClient.tsx` to use centralized colors

## Color Palette
- Cars: #10b981 (Emerald/Green)
- Motorcycles: #3b82f6 (Blue)
- Tuk Tuks: #f59e0b (Orange/Amber)
