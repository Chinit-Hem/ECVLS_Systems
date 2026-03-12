# Category Filter Fix - Implementation Plan

## Problem
Database stores: 'Car', 'Motorcycle', 'TukTuk' (singular)
UI/API sends: 'Cars', 'TukTuks' (plural)
Result: 'Cars' ILIKE 'Car' returns false → "No vehicles found"

## Solution
Implement 3 rules for robust category matching:
1. **Normalization**: LOWER() for case-insensitive comparison
2. **Fuzzy Match**: ILIKE with %wildcards%
3. **Mapping**: UI names → DB search patterns

## Tasks

### [ ] 1. Update VehicleService.ts
- Add CATEGORY_MAPPING object
- Add getCategorySearchPattern() method
- Fix applyFilters() to use LOWER(TRIM(category)) ILIKE '%pattern%'
- Update normalizeCategory() documentation

### [ ] 2. Create/Update Category Mapping Utility
- Create src/lib/categoryMapping.ts with shared mapping
- Export for use in both server and client

### [ ] 3. Update Dashboard.tsx (if needed)
- Use shared mapping utility for client-side filtering

### [ ] 4. Test the fix
- Verify 'Cars' filter matches 'Car' in database
- Verify 'TukTuks' filter matches 'TukTuk' in database
- Verify all 1,222 vehicles are correctly filterable
