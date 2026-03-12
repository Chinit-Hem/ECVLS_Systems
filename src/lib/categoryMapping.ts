/**
 * Category Mapping Utility
 * 
 * Maps UI display names to database search patterns for robust category filtering.
 * Implements Rule 3: Mapping object to link UI display names to Database values.
 * 
 * Database stores: 'Car', 'Motorcycle', 'TukTuk' (singular)
 * UI displays: 'Cars', 'Motorcycles', 'TukTuks' (plural)
 * 
 * @module categoryMapping
 */

// ============================================================================
// Category Mapping Configuration
// ============================================================================

/**
 * Maps UI category names to database search patterns
 * Keys: UI display names (plural forms)
 * Values: Database search patterns (lowercase partial matches)
 */
export const CATEGORY_TO_DB_PATTERN: Record<string, string> = {
  // Plural UI names → DB search patterns
  'Cars': 'car',
  'Motorcycles': 'motor',
  'TukTuks': 'tuk',
  'Tuk Tuks': 'tuk',
  'Trucks': 'truck',
  'Vans': 'van',
  'Buses': 'bus',
  'Other': 'other',
  
  // Singular forms also supported
  'Car': 'car',
  'Motorcycle': 'motor',
  'TukTuk': 'tuk',
  'Tuk Tuk': 'tuk',
  'Truck': 'truck',
  'Van': 'van',
  'Bus': 'bus',
  
  // Case variations
  'cars': 'car',
  'motorcycles': 'motor',
  'tuktuks': 'tuk',
  'trucks': 'truck',
  'vans': 'van',
  'buses': 'bus',
  'CAR': 'car',
  'MOTORCYCLE': 'motor',
  'TUKTUK': 'tuk',
};

/**
 * Maps database values to normalized UI display names
 * Used for consistent display across the application
 */
export const DB_TO_DISPLAY_NAME: Record<string, string> = {
  'car': 'Cars',
  'motor': 'Motorcycles',
  'motorcycle': 'Motorcycles',
  'tuk': 'TukTuks',
  'tuktuk': 'TukTuks',
  'tuk-tuk': 'TukTuks',
  'truck': 'Trucks',
  'van': 'Vans',
  'bus': 'Buses',
  'other': 'Other',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get database search pattern for a UI category name
 * Implements Rule 3: Mapping from UI to DB
 * 
 * @param category - UI category name (e.g., 'Cars', 'TukTuks')
 * @returns Database search pattern (e.g., 'car', 'tuk')
 */
export function getCategorySearchPattern(category: string): string {
  if (!category) return '%';
  
  // Direct mapping lookup
  const pattern = CATEGORY_TO_DB_PATTERN[category];
  if (pattern) {
    return `%${pattern}%`;
  }
  
  // Fallback: lowercase and extract base pattern
  const lower = category.toLowerCase().trim();
  
  // Check for partial matches in the mapping values
  for (const [key, value] of Object.entries(CATEGORY_TO_DB_PATTERN)) {
    if (lower === key.toLowerCase()) {
      return `%${value}%`;
    }
  }
  
  // Last resort: use the input as a wildcard pattern
  return `%${lower}%`;
}

/**
 * Normalize category to display name
 * Converts database values to consistent UI display names
 * 
 * @param category - Raw category from database or input
 * @returns Normalized display name (e.g., 'Cars', 'Motorcycles')
 */
export function normalizeCategoryToDisplay(category: string): string {
  if (!category) return 'Other';
  
  const lower = category.toLowerCase().trim();
  
  // Check for pattern matches
  if (lower.includes('car')) return 'Cars';
  if (lower.includes('motor')) return 'Motorcycles';
  if (lower.includes('tuk')) return 'TukTuks';
  if (lower.includes('truck')) return 'Trucks';
  if (lower.includes('van')) return 'Vans';
  if (lower.includes('bus')) return 'Buses';
  
  // Return capitalized original
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Build SQL ILIKE pattern with wildcards
 * Implements Rule 2: Fuzzy matching with wildcards
 * 
 * @param searchTerm - Search term to wrap
 * @returns SQL ILIKE pattern (e.g., '%car%')
 */
export function buildIlikePattern(searchTerm: string): string {
  if (!searchTerm) return '%';
  
  // Escape special SQL characters
  const escaped = searchTerm
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  
  return `%${escaped}%`;
}

/**
 * Build SQL WHERE clause for category filtering
 * Implements Rule 1 & 2: LOWER() + ILIKE with wildcards
 * 
 * @param columnName - Database column name (default: 'category')
 * @param categoryValue - UI category value to filter by
 * @param paramIndex - Parameter index for prepared statement
 * @returns SQL condition string and parameter value
 */
export function buildCategoryFilter(
  columnName: string = 'category',
  categoryValue: string,
  paramIndex: number = 1
): { condition: string; param: string } {
  const pattern = getCategorySearchPattern(categoryValue);
  
  // Rule 1: LOWER() for case-insensitive comparison
  // Rule 2: ILIKE with wildcards for fuzzy matching
  const condition = `LOWER(TRIM(${columnName})) ILIKE $${paramIndex}`;
  
  return { condition, param: pattern };
}

// ============================================================================
// Export All Category Names for UI
// ============================================================================

/**
 * All valid category display names for UI dropdowns/filters
 */
export const VALID_CATEGORIES = [
  'Cars',
  'Motorcycles', 
  'TukTuks',
  'Trucks',
  'Vans',
  'Buses',
  'Other',
] as const;

export type ValidCategory = typeof VALID_CATEGORIES[number];
