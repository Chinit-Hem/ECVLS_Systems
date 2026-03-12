/**
 * Vehicles API Route - OOAD Service Layer Implementation
 * 
 * Demonstrates professional API design using VehicleService:
 * - Singleton service for business logic
 * - Case-insensitive ILIKE filtering with TRIM()
 * - SSR-optimized responses
 * - Comprehensive error handling
 * - SQL injection protection via parameterized queries
 * 
 * @module api/vehicles
 */

import { NextRequest, NextResponse } from "next/server";
import { vehicleService } from "@/services/VehicleService";
import { dbManager } from "@/lib/db-singleton";
import type { VehicleFilters } from "@/services/VehicleService";

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * Build CORS headers for cross-origin requests
 */
function buildCorsHeaders(req: NextRequest): Headers {
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  const vercelOrigin = vercelUrl
    ? vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`
    : "";
  const requestOrigin = req.headers.get("origin") || "";
  const allowedOrigin = appOrigin || vercelOrigin || requestOrigin || "*";

  const headers = new Headers({
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  });

  if (allowedOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
}

// ============================================================================
// OPTIONS Handler (CORS Preflight)
// ============================================================================

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(req),
  });
}

// ============================================================================
// GET Handler - List/Search Vehicles
// ============================================================================

/**
 * GET /api/vehicles
 * 
 * Query Parameters:
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 * - category: string (case-insensitive)
 * - brand: string (case-insensitive, partial match)
 * - model: string (case-insensitive, partial match)
 * - condition: "New" | "Used" | "Other"
 * - yearMin: number
 * - yearMax: number
 * - priceMin: number
 * - priceMax: number
 * - color: string
 * - bodyType: string
 * - taxType: string
 * - searchTerm: string (searches brand, model, plate)
 * - orderBy: string (default: "id")
 * - orderDirection: "ASC" | "DESC" (default: "ASC")
 * 
 * Returns:
 * - success: boolean
 * - data: Vehicle[]
 * - meta: { total, limit, offset, durationMs, queryCount }
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Immediate diagnostic logging
  console.log(`[API /vehicles GET] Request received: ${req.url}`);

  try {
    // Test database connection first
    try {
      const testResult = await dbManager.executeUnsafe('SELECT 1 as connection_test');
      console.log('[API /vehicles GET] DB Connection test:', testResult);
    } catch (dbTestError) {
      console.error('[API /vehicles GET] DB Connection test FAILED:', {
        error: dbTestError instanceof Error ? dbTestError.message : String(dbTestError),
        stack: dbTestError instanceof Error ? dbTestError.stack : undefined,
      });
      throw dbTestError;
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    
    const filters: VehicleFilters = {
      limit: parseInt(searchParams.get("limit") || "100", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
      orderBy: searchParams.get("orderBy") || "id",
      orderDirection: (searchParams.get("orderDirection") as "ASC" | "DESC") || "ASC",
    };

    // Optional filters (only add if provided)
    const category = searchParams.get("category");
    if (category) filters.category = category;

    const brand = searchParams.get("brand");
    if (brand) filters.brand = brand;

    const model = searchParams.get("model");
    if (model) filters.model = model;

    const condition = searchParams.get("condition");
    if (condition) filters.condition = condition;

    const yearMin = searchParams.get("yearMin");
    if (yearMin) filters.yearMin = parseInt(yearMin, 10);

    const yearMax = searchParams.get("yearMax");
    if (yearMax) filters.yearMax = parseInt(yearMax, 10);

    const priceMin = searchParams.get("priceMin");
    if (priceMin) filters.priceMin = parseInt(priceMin, 10);

    const priceMax = searchParams.get("priceMax");
    if (priceMax) filters.priceMax = parseInt(priceMax, 10);

    const color = searchParams.get("color");
    if (color) filters.color = color;

    const bodyType = searchParams.get("bodyType");
    if (bodyType) filters.bodyType = bodyType;

    const taxType = searchParams.get("taxType");
    if (taxType) filters.taxType = taxType;

    const searchTerm = searchParams.get("searchTerm");
    if (searchTerm) filters.searchTerm = searchTerm;

    // Handle withoutImage filter
    const withoutImage = searchParams.get("withoutImage");
    if (withoutImage === "1" || withoutImage === "true") {
      filters.withoutImage = true;
    }

    // When any filter is active, increase the limit to ensure all matching records are returned
    const hasActiveFilters = category || brand || model || condition || 
                           yearMin || yearMax || priceMin || priceMax || 
                           color || bodyType || taxType || searchTerm || filters.withoutImage;
    
    if (hasActiveFilters && !filters.limit) {
      filters.limit = 10000; // Get all matching records
    }

    // Execute queries in parallel for better performance
    const [vehiclesResult, countResult, statsResult] = await Promise.all([
      vehicleService.getVehicles(filters),
      // Use filtered count to match the actual query results
      vehicleService.countWithFilters(filters),
      // Skip expensive stats if in lite mode (no filters except pagination)
      (filters.category || filters.brand || filters.model || filters.condition || 
       filters.searchTerm || filters.yearMin || filters.yearMax || 
       filters.priceMin || filters.priceMax || filters.color || 
       filters.bodyType || filters.taxType || filters.withoutImage)
        ? Promise.resolve({ success: true, data: null }) // Skip stats for filtered queries
        : vehicleService.getVehicleStats(),
    ]);

    if (!vehiclesResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: vehiclesResult.error || "Failed to fetch vehicles",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: vehiclesResult.meta?.queryCount || 0,
          },
        },
        {
          status: 500,
          headers: buildCorsHeaders(req),
        }
      );
    }

    // Use filtered count for accurate pagination
    const total = countResult.success ? (countResult.data || 0) : 0;
    const stats = statsResult.success ? statsResult.data : null;

    return NextResponse.json(
      {
        success: true,
        data: vehiclesResult.data,
        meta: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          totalPages: Math.ceil(total / (filters.limit || 100)),
          durationMs: Date.now() - startTime,
          queryCount: vehiclesResult.meta?.queryCount || 0,
          cacheHit: vehiclesResult.meta?.cacheHit || false,
          // Include category and condition counts for KPIs
          countsByCategory: stats ? {
            Cars: stats.byCategory?.Cars || 0,
            Motorcycles: stats.byCategory?.Motorcycles || 0,
            TukTuks: stats.byCategory?.TukTuks || 0,
          } : undefined,
          countsByCondition: stats ? {
            New: stats.byCondition?.New || 0,
            Used: stats.byCondition?.Used || 0,
          } : undefined,
          avgPrice: stats?.avgPrice,
          noImageCount: stats?.noImageCount,
        },
      },
      {
        headers: buildCorsHeaders(req),
      }
    );
  } catch (error) {
    // Enhanced error logging for debugging
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[API /vehicles GET] Error:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    // Return more detailed error in development
    const isDev = process.env.NODE_ENV === 'development';
    const responseError = isDev 
      ? `Server Error: ${errorMessage}\n${errorStack || ''}`
      : "Internal server error";
    
    return NextResponse.json(
      {
        success: false,
        error: responseError,
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: 0,
        },
      },
      {
        status: 500,
        headers: buildCorsHeaders(req),
      }
    );
  }
}

// ============================================================================
// POST Handler - Create Vehicle
// ============================================================================

// Constants for timeout configuration
const POST_UPLOAD_TIMEOUT_MS = 25000; // 25 seconds for image upload
const POST_DB_TIMEOUT_MS = 5000; // 5 seconds for database operations
const POST_TOTAL_TIMEOUT_MS = 30000; // 30 seconds total request timeout

/**
 * Handle the actual POST request logic
 */
async function handlePostRequest(req: NextRequest, startTime: number): Promise<NextResponse> {
  try {
    // Check if request is FormData or JSON
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");
    
    let vehicleData: Record<string, unknown>;
    let imageFile: File | null = null;
    
    if (isFormData) {
      // Handle FormData with potential image upload
      const formData = await req.formData();
      
      // Extract vehicle data from form fields
      vehicleData = {};
      formData.forEach((value, key) => {
        if (key === "image" && value instanceof File) {
          imageFile = value;
        } else {
          vehicleData[key] = value;
        }
      });
    } else {
      // Handle JSON request
      vehicleData = await req.json();
    }
    
    // Create vehicle through service layer
    const result = await vehicleService.createVehicle({
      category: vehicleData.category as string,
      brand: vehicleData.brand as string,
      model: vehicleData.model as string,
      year: vehicleData.year as number,
      plate: vehicleData.plate as string,
      market_price: vehicleData.market_price as number || vehicleData.marketPrice as number,
      tax_type: vehicleData.tax_type as string || vehicleData.taxType as string,
      condition: vehicleData.condition as "New" | "Used" | "Other",
      body_type: vehicleData.body_type as string || vehicleData.bodyType as string,
      color: vehicleData.color as string,
      image_id: vehicleData.image_id as string || vehicleData.imageId as string,
      thumbnail_url: vehicleData.thumbnail_url as string || vehicleData.thumbnailUrl as string,
    });
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to create vehicle",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: result.meta?.queryCount || 0,
          },
        },
        {
          status: 500,
          headers: buildCorsHeaders(req),
        }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: result.meta?.queryCount || 0,
        },
      },
      {
        headers: buildCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error("[handlePostRequest] Error:", error);
    throw error;
  }
}

/**
 * POST /api/vehicles
 * 
 * Body: Partial<VehicleDB> (without id, created_at, updated_at)
 * Supports both JSON and FormData (with image file upload)
 * 
 * Returns:
 * - success: boolean
 * - data: Vehicle (created)
 * - meta: { durationMs, queryCount }
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  console.log("[POST /api/vehicles] Handler started");

  // Set up total request timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${POST_TOTAL_TIMEOUT_MS}ms`)), POST_TOTAL_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      handlePostRequest(req, requestStartTime),
      timeoutPromise
    ]);
    
    const duration = Date.now() - requestStartTime;
    console.log(`[POST /api/vehicles] Request completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - requestStartTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[POST /api/vehicles] Request failed after ${duration}ms:`, errorMessage);
    
    // Check if it's a timeout error
    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Request timeout. The operation took too long to complete. Please try again with a smaller image or check your network connection.",
          meta: {
            durationMs: duration,
            queryCount: 0,
          }
        },
        { status: 504, headers: buildCorsHeaders(req) }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        meta: {
          durationMs: duration,
          queryCount: 0,
        }
      },
      { status: 500, headers: buildCorsHeaders(req) }
    );
  }
}

// ============================================================================
// PUT Handler - Update Vehicle
// ============================================================================

/**
 * PUT /api/vehicles?id={number}
 * 
 * Query Parameters:
 * - id: number (required)
 * 
 * Body: Partial<VehicleDB>
 * 
 * Returns:
 * - success: boolean
 * - data: Vehicle (updated)
 * - meta: { durationMs, queryCount }
 */
export async function PUT(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid vehicle ID is required",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: 0,
          },
        },
        {
          status: 400,
          headers: buildCorsHeaders(req),
        }
      );
    }

    const body = await req.json();

    // Update vehicle through service layer
    const result = await vehicleService.updateVehicle(id, {
      category: body.category,
      brand: body.brand,
      model: body.model,
      year: body.year,
      plate: body.plate,
      market_price: body.market_price || body.marketPrice,
      tax_type: body.tax_type || body.taxType,
      condition: body.condition,
      body_type: body.body_type || body.bodyType,
      color: body.color,
      image_id: body.image_id || body.imageId,
      thumbnail_url: body.thumbnail_url || body.thumbnailUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update vehicle",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: result.meta?.queryCount || 0,
          },
        },
        {
          status: result.error?.includes("not found") ? 404 : 500,
          headers: buildCorsHeaders(req),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: result.meta?.queryCount || 0,
        },
      },
      {
        headers: buildCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error("[API /vehicles PUT] Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: 0,
        },
      },
      {
        status: 500,
        headers: buildCorsHeaders(req),
      }
    );
  }
}

// ============================================================================
// DELETE Handler - Delete Vehicle
// ============================================================================

/**
 * DELETE /api/vehicles?id={number}
 * 
 * Query Parameters:
 * - id: number (required)
 * 
 * Returns:
 * - success: boolean
 * - data: boolean (true if deleted)
 * - meta: { durationMs, queryCount }
 */
export async function DELETE(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid vehicle ID is required",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: 0,
          },
        },
        {
          status: 400,
          headers: buildCorsHeaders(req),
        }
      );
    }

    // Delete vehicle through service layer
    const result = await vehicleService.deleteVehicle(id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to delete vehicle",
          meta: {
            durationMs: Date.now() - startTime,
            queryCount: result.meta?.queryCount || 0,
          },
        },
        {
          status: 500,
          headers: buildCorsHeaders(req),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: result.meta?.queryCount || 0,
        },
      },
      {
        headers: buildCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error("[API /vehicles DELETE] Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        meta: {
          durationMs: Date.now() - startTime,
          queryCount: 0,
        },
      },
      {
        status: 500,
        headers: buildCorsHeaders(req),
      }
    );
  }
}
