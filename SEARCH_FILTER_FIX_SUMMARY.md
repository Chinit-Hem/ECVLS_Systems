# Search/Filter Data Loss Fix - Summary

## Problem
When using search or filter functionality, some data was "lost" and not showing in the list. This occurred because:
1. The API had a default limit of 100 vehicles
2. Client-side filtering only filtered the loaded vehicles (max 100)
3. When the database had more than 100 records, filtering would miss matching records that weren't in the first 100 loaded

## Solution
Implemented server-side filtering to search across the entire database:

### 1. API Route Changes (`src/app/api/vehicles/route.ts`)
- Added logic to detect when filters are active
- When any filter is applied, automatically increase the limit to 10,000 to ensure all matching records are returned
- Added support for `withoutImage` filter parameter

### 2. useVehicles Hook Changes (`src/lib/useVehicles.ts`)
- Changed from `useVehicles(noCache)` to `useVehicles(options)` signature
- Added `VehicleFilters` interface support
- Added debouncing (300ms) for search input to prevent excessive API calls
- Added `isFiltering` state to track when filters are active
- Filters are now passed to the API via query parameters

### 3. VehiclesClient Component Changes (`src/app/(app)/vehicles/VehiclesClient.tsx`)
- Added `apiFilters` useMemo to build API filter parameters from UI filter state
- Updated `useVehicles` call to pass filters
- Server now returns pre-filtered results instead of filtering client-side

### 4. API Client Changes (`src/lib/api.ts`)
- Added `VehicleFilters` interface with all filter fields:
  - search, category, brand, model, condition
  - yearMin, yearMax, priceMin, priceMax
  - color, bodyType, taxType
  - dateFrom, dateTo, withoutImage
- Updated `getVehicles` to build query string with filter parameters
- When filters are active, automatically sets limit to 10,000

## Key Features
1. **Server-side filtering**: All filtering now happens at the database level
2. **Debounced search**: 300ms debounce prevents excessive API calls while typing
3. **High limit for filtered queries**: When filters are active, limit increases to 10,000 to ensure all matches are returned
4. **Backward compatible**: No filters = default behavior (limit 100)

## Testing
Test scripts available:
- `scripts/test-search-api.mjs` - Tests search across categories, brands, conditions
- `scripts/test-search-all-data.mjs` - Comprehensive search test

## Files Modified
1. `src/app/api/vehicles/route.ts` - Added server-side filter handling
2. `src/lib/useVehicles.ts` - Added filter support with debouncing
3. `src/lib/api.ts` - Added VehicleFilters interface and query building
4. `src/app/(app)/vehicles/VehiclesClient.tsx` - Integrated server-side filtering

## Result
- All search/filter operations now query the entire database
- No more "lost" data when filtering
- Better performance with debounced API calls
- Accurate result counts displayed in UI
