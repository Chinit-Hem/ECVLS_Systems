# Cloudinary Unsigned Upload Fix - 502 Error Resolution

## Problem
The application was experiencing **502 Bad Gateway errors** with 18-second timeouts when uploading vehicle images. The root cause was that the Next.js API server was processing image uploads to Cloudinary, which took too long and caused Vercel's serverless functions to timeout.

## Solution
Rewrote the upload logic to use **Cloudinary Unsigned Upload** directly from the frontend, completely bypassing the Next.js API server for image processing.

## Architecture Change

### Before (Caused 502 Errors)
```
Frontend → Next.js API → Cloudinary → Database
         (18s timeout)   (slow)
```

### After (Eliminates 502 Errors)
```
Frontend → Cloudinary (direct) → Next.js API → Database
         (fast, no timeout)    (lightweight, <1s)
```

## Implementation Details

### 1. Frontend Changes (`useUpdateVehicleOptimistic.ts`)

**New Function: `uploadToCloudinaryDirectly()`**
- Uploads images directly to `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`
- Uses unsigned upload preset (no signature required)
- Includes folder organization based on vehicle category
- Returns the Cloudinary URL

**Modified `updateVehicle()` Flow:**
1. Compress image client-side (reduces upload time)
2. Upload compressed image directly to Cloudinary
3. Receive Cloudinary URL
4. Send JSON payload with URL to API
5. API updates database only

**Key Changes:**
- Removed FormData logic (no longer needed)
- Removed server-side image processing
- Uses JSON-only communication with API
- Maintains retry logic for transient errors

### 2. API Changes (`[id]/route.ts`)

**Removed:**
- All image file handling logic (~200 lines)
- FormData parsing for images
- Cloudinary SDK upload calls
- Image compression on server
- Complex timeout handling for uploads

**Simplified To:**
- Only accepts `application/json` content-type
- Only accepts `image_id` as URL string
- Lightweight database updates only
- Reduced timeout from 30s to 10s (since no image processing)

## Environment Variables

Add these to your `.env.local` file:

```env
# Frontend Cloudinary Configuration (for unsigned uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Backend Cloudinary Configuration (for image deletion, still needed)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Setting Up Cloudinary Unsigned Upload Preset

1. Log in to [Cloudinary Console](https://cloudinary.com/console)
2. Go to **Settings** → **Upload** → **Upload presets**
3. Click **"Add upload preset"**
4. Configure:
   - **Preset name**: `vms_unsigned` (or your preferred name)
   - **Signing Mode**: **Unsigned**
   - **Folder**: Leave empty (we set this dynamically)
   - **Allowed formats**: `jpg,png,webp,gif`
   - **Max file size**: `10000000` (10MB)
   - **Incoming transformation**: Optional (e.g., `c_limit,w_1920` for max width)
5. Save the preset
6. Copy the preset name to `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Benefits

1. **Eliminates 502 Errors**: Server no longer processes images
2. **Faster Uploads**: Direct browser-to-Cloudinary connection
3. **Better UX**: No 18-second timeouts
4. **Scalable**: Server only handles lightweight database operations
5. **Cost Effective**: Reduced serverless function execution time

## Testing

To verify the fix works:

1. **Test Image Upload:**
   ```bash
   # Run the test script
   node scripts/test-cloudinary-unsigned-upload.mjs
   ```

2. **Check Environment Variables:**
   ```bash
   node scripts/check-cloudinary-config.mjs
   ```

3. **Monitor Network Tab:**
   - Open browser DevTools → Network tab
   - Upload an image in the vehicle form
   - You should see:
     - POST to `https://api.cloudinary.com/v1_1/...` (direct upload)
     - PUT to `/api/vehicles/[id]` with JSON payload (fast, <1s)

## Rollback Plan

If issues occur, you can revert to the previous implementation by:

1. Restoring the original `useUpdateVehicleOptimistic.ts` from git
2. Restoring the original `[id]/route.ts` from git
3. Removing the new environment variables

```bash
git checkout HEAD -- src/app/components/vehicles/useUpdateVehicleOptimistic.ts
git checkout HEAD -- src/app/api/vehicles/[id]/route.ts
```

## Files Modified

1. `src/app/components/vehicles/useUpdateVehicleOptimistic.ts` - Complete rewrite
2. `src/app/api/vehicles/[id]/route.ts` - Simplified, removed image handling

## Migration Checklist

- [ ] Set up Cloudinary unsigned upload preset
- [ ] Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to environment
- [ ] Add `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to environment
- [ ] Deploy to staging and test image uploads
- [ ] Monitor for 502 errors (should be eliminated)
- [ ] Deploy to production

## Notes

- The backend still needs `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for image deletion when vehicles are deleted
- Image compression still happens client-side before upload to reduce bandwidth
- The folder structure in Cloudinary is maintained (Cars, Motorcycles, TukTuks)
- All existing images continue to work (no migration needed)
