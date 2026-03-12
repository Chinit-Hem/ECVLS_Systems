# Fix Search/Filter Data Loss Issue

## Problem
- API has default limit of 100 vehicles
- Client-side filtering only filters loaded vehicles (max 100)
- When database has more vehicles, data appears "lost" when filtering

## Solution
Implement server-side filtering so all database records are searchable

## Implementation Steps

### 1. Update `src/lib/api.ts` - Add filter support to vehicleApi
- [x] Add VehicleFilters type
- [x] Update getVehicles to accept filter parameters
- [x] Build query string with all filter fields

### 2. Update `src/lib/useVehicles.ts` - Add filter support
- [x] Add filters parameter to hook
- [x] Pass filters to API call
- [x] Add debouncing for search input
- [x] Handle loading states for filter operations

### 3. Update `src/app/api/vehicles/route.ts` - Increase limit for filtered queries
- [x] Remove or increase limit when filters are active
- [x] Ensure all matching records are returned

### 4. Update `src/app/(app)/vehicles/VehiclesClient.tsx` - Use server-side filtering
- [x] Remove client-side filtering logic
- [x] Pass filters to useVehicles hook
- [x] Keep UI filter state
- [x] Support multiple field search

### 5. Test the implementation
- [ ] Run test scripts to verify all data is searchable
- [ ] Verify filters work correctly
- [ ] Check performance with large datasets

## Files Modified
1. `src/lib/api.ts` - Added filter support to vehicleApi
2. `src/lib/useVehicles.ts` - Added filter parameters and debouncing
3. `src/app/api/vehicles/route.ts` - Increased limit for filtered queries
4. `src/app/(app)/vehicles/VehiclesClient.tsx` - Switched to server-side filtering
