import { vehicleService } from "@/services/VehicleService";
import Dashboard from "@/app/components/dashboard/Dashboard";

// Disable ISR caching - always fetch fresh data
export const revalidate = 0;

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";

/**
 * Dashboard Server Component
 * Fetches initial data server-side with caching for performance
 */
export default async function Page() {
  try {
    // Fetch vehicles and stats in parallel
    // Use cache for better performance - stats don't change frequently
    const [vehiclesResult, statsResult] = await Promise.all([
      vehicleService.getVehicles({ limit: 100 }), // Limit initial load, client can fetch more
      vehicleService.getVehicleStats(false), // Use cache (30s TTL) - much faster
    ]);

    // Extract data or use defaults
    const vehicles = vehiclesResult.success ? vehiclesResult.data || [] : [];
    const stats = statsResult.success ? statsResult.data : null;

    // Build metadata for client
    const meta = stats
      ? {
          total: stats.total,
          countsByCategory: {
            Cars: stats.byCategory.Cars || 0,
            Motorcycles: stats.byCategory.Motorcycles || 0,
            TukTuks: stats.byCategory.TukTuks || 0,
          },
          countsByCondition: {
            New: stats.byCondition.New || 0,
            Used: stats.byCondition.Used || 0,
          },
          noImageCount: stats.noImageCount,
          avgPrice: stats.avgPrice,
        }
      : null;

    return (
      <Dashboard
        initialVehicles={vehicles}
        initialMeta={meta}
        initialError={!vehiclesResult.success ? vehiclesResult.error || "Failed to load vehicles" : null}
      />
    );
  } catch (error) {
    console.error("[Dashboard Page] Error fetching data:", error);
    
    // Return dashboard with empty data and error message
    return (
      <Dashboard
        initialVehicles={[]}
        initialMeta={null}
        initialError={error instanceof Error ? error.message : "Database connection failed. Please check your connection."}
      />
    );
  }
}
