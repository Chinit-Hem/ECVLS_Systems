"use client";

import { useState, useCallback } from "react";
import { compressImage } from "@/lib/clientImageCompression";
import { getCloudinaryFolder } from "@/lib/cloudinary-folders";
import { recordMutation } from "@/lib/vehicleCache";
import type { Vehicle } from "@/lib/types";

interface UseUpdateVehicleOptimisticOptions {
  onSuccess?: (vehicle: Vehicle) => void;
  onError?: (error: Error, originalVehicle: Vehicle) => void;
}

interface UseUpdateVehicleOptimisticReturn {
  updateVehicle: (
    vehicleId: string,
    data: Partial<Vehicle>,
    originalVehicle: Vehicle,
    imageFile?: File | null
  ) => Promise<void>;
  isUpdating: boolean;
}

// Maximum retry attempts for transient errors - ULTRA-OPTIMIZED for minimal delay
const MAX_RETRY_ATTEMPTS = 1; // Single retry for fastest response
const RETRY_DELAY_MS = 100; // Minimal retry delay - reduced from 300ms
const MAX_CLOUDINARY_RETRIES = 2; // Increased retries for direct Cloudinary upload
const CLOUDINARY_RETRY_DELAY = 500; // Slightly longer delay for Cloudinary

// Image compression settings - ULTRA-OPTIMIZED for speed
const COMPRESSION_MAX_WIDTH = 800; // Optimized width
const COMPRESSION_QUALITY = 0.7; // Optimized quality

// Skip compression if file is already small enough (under 800KB)
// This prevents double compression when VehicleForm already compressed the image
const SKIP_COMPRESSION_THRESHOLD_KB = 800;

// Cloudinary configuration - CLIENT-SIDE SIGNED UPLOAD
// These MUST be set in environment variables with NEXT_PUBLIC_ prefix
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "vehicle_uploads";

// Helper function to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if error is retryable
const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  const has502 = message.includes('502') || message.includes('[http 502]');
  const has504 = message.includes('504') || message.includes('[http 504]');
  const hasTimeout = message.includes('timeout');
  const hasNetworkError = message.includes('network') || 
                          message.includes('econnreset') ||
                          message.includes('econnrefused') ||
                          message.includes('socket hang up');
  
  const statusCode = (error as Error & { statusCode?: number }).statusCode;
  const isRetryableStatus = statusCode === 502 || statusCode === 504 || statusCode === 503;
  
  return has502 || has504 || hasTimeout || hasNetworkError || isRetryableStatus;
};

/**
 * Validate Cloudinary configuration
 */
function validateCloudinaryConfig(): { valid: boolean; error?: string } {
  if (!CLOUDINARY_CLOUD_NAME) {
    return {
      valid: false,
      error: "Cloudinary Cloud Name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment variables."
    };
  }
  
  if (!CLOUDINARY_UPLOAD_PRESET) {
    return {
      valid: false,
      error: "Cloudinary Upload Preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables."
    };
  }
  
  return { valid: true };
}

/**
 * Upload image file to Cloudinary using unsigned upload preset with retry logic
 * CLIENT-SIDE: Uploads directly from browser to Cloudinary (bypasses Vercel server)
 */
async function uploadImageToCloudinaryWithRetry(
  file: File,
  category: string,
  vehicleId: string,
  maxRetries: number = MAX_CLOUDINARY_RETRIES
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`[uploadImageToCloudinary] Attempt ${attempt}/${maxRetries + 1}`);
      const result = await uploadImageToCloudinary(file, category, vehicleId);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown upload error");
      
      // Don't retry on configuration errors
      if (lastError.message.includes('configuration error') || 
          lastError.message.includes('Upload Preset Error') ||
          lastError.message.includes('Cloud Name Error')) {
        throw lastError;
      }
      
      if (attempt <= maxRetries) {
        console.log(`[uploadImageToCloudinary] Retrying after ${CLOUDINARY_RETRY_DELAY}ms...`);
        await delay(CLOUDINARY_RETRY_DELAY);
      }
    }
  }
  
  throw lastError || new Error("Cloudinary upload failed after retries");
}

/**
 * Fetch signed upload parameters from server
 */
async function fetchUploadSignature(
  folder: string,
  publicId: string,
  tags: string[]
): Promise<{
  signature: string;
  timestamp: number;
  api_key: string;
  upload_preset: string;
  folder: string;
  public_id?: string;
  tags?: string;
}> {
  const response = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folder,
      public_id: publicId,
      tags,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to get upload signature: ${response.status}`
    );
  }

  const result = await response.json();
  
  if (!result.ok || !result.data) {
    throw new Error(result.error || "Invalid signature response");
  }

  return result.data;
}

/**
 * Upload image file directly to Cloudinary from the browser
 * Uses SIGNED upload with server-generated signature
 * This bypasses Vercel entirely and prevents 502/504 errors
 * while keeping API secret secure on the server
 */
async function uploadImageToCloudinary(
  file: File,
  category: string,
  vehicleId: string
): Promise<string> {
  // Validate configuration first
  const configValidation = validateCloudinaryConfig();
  if (!configValidation.valid) {
    throw new Error(`Configuration Error: ${configValidation.error}`);
  }

  // Build Cloudinary upload URL
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  // Get folder based on category
  const folder = getCloudinaryFolder(category);
  const publicId = `vehicle_${vehicleId}_${Date.now()}`;
  const tags = [category, "vms", "vehicle"];

  console.log(`[uploadImageToCloudinary] Fetching signed upload params...`, {
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder,
    vehicleId,
    category,
  });

  // Step 1: Fetch signed upload parameters from server
  let signatureData;
  try {
    signatureData = await fetchUploadSignature(folder, publicId, tags);
  } catch (error) {
    console.error('[uploadImageToCloudinary] Failed to get signature:', error);
    throw new Error(
      error instanceof Error 
        ? `Signature Error: ${error.message}` 
        : "Failed to get upload signature"
    );
  }

  console.log(`[uploadImageToCloudinary] Uploading directly to Cloudinary (signed):`, {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: signatureData.upload_preset,
    folder: signatureData.folder,
    vehicleId,
    category,
    fileSize: `${(file.size / 1024).toFixed(2)}KB`,
    fileType: file.type,
    hasSignature: !!signatureData.signature,
  });

  // Step 2: Create form data for Cloudinary with signed params
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", signatureData.upload_preset);
  formData.append("folder", signatureData.folder);
  formData.append("public_id", signatureData.public_id || publicId);
  formData.append("api_key", signatureData.api_key);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("signature", signatureData.signature);
  
  if (signatureData.tags) {
    formData.append("tags", signatureData.tags);
  }

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
      // No credentials needed for signed uploads
    });

    console.log(`[uploadImageToCloudinary] Cloudinary response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 
                          errorData.message || 
                          `Cloudinary upload failed: ${response.status}`;
      
      console.error('[uploadImageToCloudinary] Cloudinary upload error:', {
        status: response.status,
        error: errorMessage,
        errorData,
      });
      
      // Create error with status code for retry logic
      const error = new Error(errorMessage);
      (error as Error & { statusCode?: number }).statusCode = response.status;
      throw error;
    }

    const result = await response.json();
    
    if (!result.secure_url) {
      console.error('[uploadImageToCloudinary] No secure_url in Cloudinary response:', result);
      throw new Error("Cloudinary response missing secure_url");
    }

    console.log(`[uploadImageToCloudinary] Success:`, {
      url: result.secure_url.substring(0, 100) + "...",
      publicId: result.public_id,
      folder: folder,
      bytes: result.bytes,
      format: result.format,
    });

    return result.secure_url;
    
  } catch (error) {
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[uploadImageToCloudinary] Network error:', error);
      throw new Error(`Network error uploading to Cloudinary: ${error.message}. Please check your internet connection.`);
    }
    
    throw error;
  }
}

/**
 * Convert Base64 string to File object
 */
function base64ToFile(base64String: string, filename: string): File {
  const arr = base64String.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function useUpdateVehicleOptimistic(
  options: UseUpdateVehicleOptimisticOptions = {}
): UseUpdateVehicleOptimisticReturn {
  const { onSuccess, onError } = options;
  const [isUpdating, setIsUpdating] = useState(false);

  const updateVehicle = useCallback(
    async (
      vehicleId: string,
      data: Partial<Vehicle>,
      originalVehicle: Vehicle,
      imageFile?: File | null
    ): Promise<void> => {
      setIsUpdating(true);
      const totalStartTime = performance.now();

      console.log(`[updateVehicle] Starting update for vehicle ${vehicleId}`, {
        hasImageFile: !!imageFile,
        hasImageInData: !!data.Image,
        imageType: data.Image ? (data.Image.startsWith("data:image/") ? "base64" : "url") : "none",
      });

      let lastError: Error | null = null;
      let attempts = 0;
      let cloudinaryImageUrl: string | null = null;
      let compressionTime = 0;
      let uploadTime = 0;

      // Step 1: Handle image upload to Cloudinary (OUTSIDE retry loop - do this once)
      try {
        // Case A: We have a File object from file input
        if (imageFile) {
          const fileSizeKB = imageFile.size / 1024;
          
          // Skip compression if file is already small enough (prevents double compression)
          let fileToUpload: File;
          
          if (fileSizeKB < SKIP_COMPRESSION_THRESHOLD_KB) {
            console.log(`[updateVehicle] File already small (${fileSizeKB.toFixed(2)}KB < ${SKIP_COMPRESSION_THRESHOLD_KB}KB), skipping compression`);
            fileToUpload = imageFile;
          } else {
            const compressionStart = performance.now();
            console.log(`[updateVehicle] Compressing image file (${fileSizeKB.toFixed(2)}KB)...`);
            
            const compressedResult = await compressImage(imageFile, {
              maxWidth: COMPRESSION_MAX_WIDTH,
              quality: COMPRESSION_QUALITY,
            });
            
            compressionTime = performance.now() - compressionStart;
            
            console.log(`[updateVehicle] Image compressed:`, {
              originalSize: `${(imageFile.size / 1024).toFixed(2)}KB`,
              compressedSize: `${(compressedResult.compressedSize / 1024).toFixed(2)}KB`,
              compressionRatio: `${((1 - compressedResult.compressedSize / compressedResult.originalSize) * 100).toFixed(1)}%`,
              compressionTime: `${compressionTime.toFixed(2)}ms`,
            });
            
            fileToUpload = compressedResult.file;
          }

          const uploadStart = performance.now();
          console.log(`[updateVehicle] [TIMING] Starting Cloudinary upload at ${uploadStart.toFixed(2)}ms`);
          
          cloudinaryImageUrl = await uploadImageToCloudinaryWithRetry(
            fileToUpload,
            data.Category || originalVehicle.Category || "Cars",
            vehicleId
          );
          
          uploadTime = performance.now() - uploadStart;
          console.log(`[updateVehicle] [TIMING] Cloudinary upload completed in ${uploadTime.toFixed(2)}ms`, {
            url: cloudinaryImageUrl.substring(0, 100) + "...",
          });
        }
        // Case B: We have a Base64 string in data.Image
        else if (data.Image && data.Image.startsWith("data:image/")) {
          const base64Start = performance.now();
          console.log(`[updateVehicle] [TIMING] Starting Base64 conversion at ${base64Start.toFixed(2)}ms`);
          
          const fileFromBase64 = base64ToFile(data.Image, `vehicle_${vehicleId}_${Date.now()}.jpg`);
          
          const base64Time = performance.now() - base64Start;
          console.log(`[updateVehicle] [TIMING] Base64 conversion completed in ${base64Time.toFixed(2)}ms`, {
            size: `${(fileFromBase64.size / 1024).toFixed(2)}KB`,
          });

          const uploadStart = performance.now();
          console.log(`[updateVehicle] [TIMING] Starting Cloudinary upload at ${uploadStart.toFixed(2)}ms`);
          
          cloudinaryImageUrl = await uploadImageToCloudinaryWithRetry(
            fileFromBase64,
            data.Category || originalVehicle.Category || "Cars",
            vehicleId
          );
          
          uploadTime = performance.now() - uploadStart;
          console.log(`[updateVehicle] [TIMING] Cloudinary upload completed in ${uploadTime.toFixed(2)}ms`, {
            url: cloudinaryImageUrl.substring(0, 100) + "...",
          });
        }
        // Case C: We have an existing URL in data.Image
        else if (data.Image && (data.Image.startsWith("http://") || data.Image.startsWith("https://"))) {
          console.log(`[updateVehicle] Using existing URL (no upload needed):`, {
            url: data.Image.substring(0, 100) + "...",
          });
          cloudinaryImageUrl = data.Image;
        }
      } catch (uploadError) {
        console.error(`[updateVehicle] Image upload failed:`, uploadError);
        setIsUpdating(false);
        const error = uploadError instanceof Error ? uploadError : new Error("Image upload failed");
        onError?.(error, originalVehicle);
        throw error;
      }

      // Step 2: Validate image upload result
      // CRITICAL: If an image was provided but upload failed, block update
      const imageWasProvided = !!imageFile || (data.Image && data.Image.startsWith("data:image/"));
      const imageUploadFailed = imageWasProvided && !cloudinaryImageUrl;
      const imageUrlIsInvalid = cloudinaryImageUrl === "undefined" || 
                                cloudinaryImageUrl === "null" || 
                                (cloudinaryImageUrl && cloudinaryImageUrl.includes("/undefined"));

      if (imageUploadFailed || imageUrlIsInvalid) {
        console.error(`[updateVehicle] Image upload failed or returned invalid URL:`, {
          cloudinaryImageUrl,
          imageWasProvided,
          imageUploadFailed,
          imageUrlIsInvalid,
        });
        setIsUpdating(false);
        const error = new Error(
          imageUrlIsInvalid 
            ? "Image upload returned an invalid URL. Please try uploading the image again."
            : "Image upload failed. Please check your internet connection and try again."
        );
        onError?.(error, originalVehicle);
        throw error;
      }

      // Step 3: Prepare payload with Cloudinary URL (never send Base64)
      const payload: Record<string, unknown> = {
        id: vehicleId,
        category: data.Category || originalVehicle.Category,
        brand: data.Brand || originalVehicle.Brand,
        model: data.Model || originalVehicle.Model,
        year: data.Year || originalVehicle.Year,
        plate: data.Plate || originalVehicle.Plate,
        color: data.Color || originalVehicle.Color,
        condition: data.Condition || originalVehicle.Condition,
        body_type: data.BodyType || originalVehicle.BodyType,
        tax_type: data.TaxType || originalVehicle.TaxType,
        market_price: data.PriceNew || originalVehicle.PriceNew,
      };

      // Only add image_id if we have a valid Cloudinary URL
      // CRITICAL: Never send Base64 strings to the API - they cause 502/503 errors
      if (cloudinaryImageUrl && 
          (cloudinaryImageUrl.startsWith('http://') || 
           cloudinaryImageUrl.startsWith('https://'))) {
        // Double-check that we're not accidentally sending a Base64 string
        if (cloudinaryImageUrl.startsWith('data:image/')) {
          console.error(`[updateVehicle] CRITICAL: Attempted to send Base64 in payload! Blocking.`);
          setIsUpdating(false);
          const error = new Error("Image upload failed: Invalid image format detected. Please try again.");
          onError?.(error, originalVehicle);
          throw error;
        }
        payload.image_id = cloudinaryImageUrl;
        console.log(`[updateVehicle] Payload will include Cloudinary URL`);
      } else {
        console.log(`[updateVehicle] No image to save - payload has no image_id`);
      }

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      // Final safety check: ensure no Base64 data in any payload field
      const payloadString = JSON.stringify(payload);
      if (payloadString.includes('data:image/')) {
        console.error(`[updateVehicle] CRITICAL: Base64 detected in payload! Aborting.`);
        setIsUpdating(false);
        const error = new Error("Image upload failed: Base64 data detected in payload. Please try again.");
        onError?.(error, originalVehicle);
        throw error;
      }

      // Step 4: Send to API with retry logic (only for the API call, not upload)
      let apiCallTime = 0;
      while (attempts < MAX_RETRY_ATTEMPTS) {
        attempts++;
        
        console.log(`[updateVehicle] API call attempt ${attempts}/${MAX_RETRY_ATTEMPTS}`);

        try {
          const apiStart = performance.now();
          console.log(`[updateVehicle] [TIMING] Starting API call at ${apiStart.toFixed(2)}ms`);
          
          const res = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include",
          });

          apiCallTime = performance.now() - apiStart;
          console.log(`[updateVehicle] [TIMING] API call completed in ${apiCallTime.toFixed(2)}ms - Status: ${res.status}`);

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const errorMessage = json.error || `Failed to update vehicle: ${res.status}`;
            throw new Error(`[HTTP ${res.status}] ${errorMessage}`);
          }

          const result = await res.json();

          if (!result.ok) {
            throw new Error(result.error || "API returned error");
          }

          const updatedVehicle = result.data || { ...originalVehicle, ...data, Image: cloudinaryImageUrl };
          
          const totalTime = performance.now() - totalStartTime;
          console.log(`[updateVehicle] [TIMING] ✅ Update successful for vehicle ${vehicleId}`);
          console.log(`[updateVehicle] [TIMING] 📊 Performance Summary:`, {
            totalTime: `${totalTime.toFixed(2)}ms`,
            compressionTime: compressionTime > 0 ? `${compressionTime.toFixed(2)}ms` : 'N/A',
            uploadTime: uploadTime > 0 ? `${uploadTime.toFixed(2)}ms` : 'N/A',
            apiCallTime: `${apiCallTime.toFixed(2)}ms`,
            hasImage: !!cloudinaryImageUrl,
          });

          // Record mutation to trigger auto-refresh - ASYNC to not block success response
          setTimeout(() => {
            recordMutation();
            console.log(`[updateVehicle] Mutation recorded - VehicleList will auto-refresh`);
          }, 0);

          // Call success callback immediately (don't wait for cache)
          onSuccess?.(updatedVehicle);
          
          setIsUpdating(false);
          return;
          
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Failed to update vehicle");
          
          console.error(`[updateVehicle] API error on attempt ${attempts}:`, lastError.message);

          // Check if we should retry
          if (attempts < MAX_RETRY_ATTEMPTS && isRetryableError(lastError)) {
            console.log(`[updateVehicle] Retrying after ${RETRY_DELAY_MS}ms...`);
            await delay(RETRY_DELAY_MS); // Fixed minimal delay - no exponential backoff
            continue;
          }
          
          break;
        }
      }

      // All retries exhausted
      setIsUpdating(false);
      
      if (lastError) {
        const enhancedError = new Error(
          `${lastError.message}\n\n(Attempted ${attempts} time${attempts > 1 ? 's' : ''})`
        );
        onError?.(enhancedError, originalVehicle);
        throw enhancedError;
      }
    },
    [onSuccess, onError]
  );

  return {
    updateVehicle,
    isUpdating,
  };
}
