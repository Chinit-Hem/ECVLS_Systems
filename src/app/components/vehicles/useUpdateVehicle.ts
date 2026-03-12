"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/compressImage";
import { refreshVehicleCache, writeVehicleCache } from "@/lib/vehicleCache";
import type { Vehicle } from "@/lib/types";

interface UpdateVehicleData {
  VehicleId: string;
  [key: string]: string | number | boolean | null | undefined;
}


interface UseUpdateVehicleResult {
  updateVehicle: (data: UpdateVehicleData, imageFile?: File | null) => Promise<boolean>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateVehicle(
  onSuccess?: () => void,
  onError?: (error: string) => void
): UseUpdateVehicleResult {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVehicle = useCallback(
    async (data: UpdateVehicleData, imageFile?: File | null): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        let body: string | FormData;
        const headers: Record<string, string> = {};

        // Map capitalized keys to lowercase for API compatibility
        const keyMapping: Record<string, string> = {
          "VehicleId": "id",
          "Category": "category",
          "Brand": "brand",
          "Model": "model",
          "Year": "year",
          "Plate": "plate",
          "Color": "color",
          "Condition": "condition",
          "BodyType": "body_type",
          "TaxType": "tax_type",
          "PriceNew": "market_price",
          "Image": "image_id",
        };

        if (imageFile) {
          // Use FormData for image uploads
          const formData = new FormData();
          
          // Add vehicle data with mapped keys
          Object.entries(data).forEach(([key, value]) => {
            if (value != null && key !== "Image") {
              const mappedKey = keyMapping[key] || key.toLowerCase();
              formData.append(mappedKey, String(value));
            }
          });

          // Compress and add the image
          const compressedResult = await compressImage(imageFile, {
            maxWidth: 1280,
            quality: 0.75,
            targetMinSizeKB: 250,
            targetMaxSizeKB: 800,
          });
          formData.append("image", compressedResult.file);

          body = formData;
        } else {
          // Use JSON for non-image updates with mapped keys
          headers["Content-Type"] = "application/json";
          const mappedData: Record<string, unknown> = {};
          Object.entries(data).forEach(([key, value]) => {
            if (value != null) {
              const mappedKey = keyMapping[key] || key.toLowerCase();
              mappedData[mappedKey] = value;
            }
          });
          body = JSON.stringify(mappedData);
        }

        const res = await fetch(`/api/vehicles/${encodeURIComponent(data.VehicleId)}`, {
          method: "PUT",
          headers,
          body,
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
          return false;
        }

        const json = await res.json().catch(() => ({}));
        
        if (res.status === 403) {
          throw new Error("You don't have permission to update this vehicle");
        }
        
        if (!res.ok || json.ok === false) {
          // Add HTTP status prefix for retry logic detection
          const error = new Error(`[HTTP ${res.status}] ${json.error || "Failed to save vehicle"}`);
          (error as Error & { statusCode: number }).statusCode = res.status;
          throw error;
        }

        // Get the updated vehicle data from the response (includes new image URL)
        const updatedVehicle = json.data as Vehicle;
        console.log("[useUpdateVehicle] Updated vehicle received:", {
          vehicleId: updatedVehicle.VehicleId,
          imageUrl: updatedVehicle.Image?.substring(0, 100) + "..."
        });
        
        // Update local cache immediately with the new data
        try {
          const cached = localStorage.getItem("vms-vehicles");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const index = parsed.findIndex((v: Vehicle) => v.VehicleId === data.VehicleId);
              if (index >= 0) {
                // Use the server-returned data which includes the new image URL
                parsed[index] = updatedVehicle;
                writeVehicleCache(parsed);
                console.log("[useUpdateVehicle] Cache updated with new image URL");
              }
            }
          }
        } catch (e) {
          console.error("[useUpdateVehicle] Cache update error:", e);
        }

        // Also trigger a background cache refresh
        refreshVehicleCache().catch(() => {});



        onSuccess?.();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save vehicle";
        setError(errorMessage);
        onError?.(errorMessage);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [router, onSuccess, onError]
  );

  return {
    updateVehicle,
    isUpdating,
    error,
  };
}
