# Image Display Fix for Edit Vehicle Page

## Problem
When updating a vehicle image from the Edit Vehicle page, the image doesn't display after upload. The form shows "Preview" and "Uploaded Image" labels but the image is not visible.

## Root Cause
The Edit Vehicle page (`src/app/(app)/vehicles/[id]/edit/page.tsx`) uses the old `useUpdateVehicle` hook which sends FormData to the API. However, the API (`src/app/api/vehicles/[id]/route.ts`) now **only accepts JSON** and explicitly rejects FormData with this error message: "This API only accepts JSON. Image uploads should be done directly to Cloudinary from the frontend."

The dashboard/modal uses `useUpdateVehicleOptimistic` which correctly uploads images to Cloudinary first, then sends the URL as JSON - this is why it works there but not on the edit page.

## Solution
Update the Edit Vehicle page to use `useUpdateVehicleOptimistic` instead of `useUpdateVehicle`.

## Implementation Steps
- [x] 1. Analyze the issue and identify root cause
- [x] 2. Update `src/app/(app)/vehicles/[id]/edit/page.tsx` to use `useUpdateVehicleOptimistic`
- [x] 3. Update the `handleSubmit` function to pass original vehicle data
- [x] 4. Update `handleUpdateSuccess` callback signature to accept optional vehicle parameter
- [x] 5. Test the fix

## Files Edited
- `src/app/(app)/vehicles/[id]/edit/page.tsx` - Switched from `useUpdateVehicle` to `useUpdateVehicleOptimistic`

## Changes Made
1. **Import change**: Replaced `useUpdateVehicle` with `useUpdateVehicleOptimistic`
2. **Hook initialization**: Changed from positional arguments to options object with `onSuccess` and `onError` callbacks
3. **handleSubmit**: Updated to pass the correct parameters (vehicleId, formData, originalVehicle, imageFile) as required by the optimistic hook
4. **handleUpdateSuccess**: Updated signature to accept optional `updatedVehicle` parameter

## How It Works Now
1. When user uploads an image on the Edit Vehicle page, the `useUpdateVehicleOptimistic` hook:
   - Compresses the image client-side for faster upload
   - Uploads the image directly to Cloudinary from the browser
   - Gets the Cloudinary URL back
   - Sends the vehicle data + Cloudinary URL as JSON to the API
   - The API updates the database with the Cloudinary URL
   - The image displays correctly because it's served from Cloudinary's CDN

## Verification
The fix ensures that:
- Images are uploaded directly to Cloudinary (not through the API)
- The API receives only JSON data (no FormData)
- The image URL is properly saved and returned
- The image displays correctly after update
