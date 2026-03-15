# Client-Side Signed Upload Implementation

## Task
Switch from unsigned to signed Cloudinary upload flow to improve security while keeping client-side upload benefits.

## Implementation Steps

- [x] 1. Create `/api/cloudinary-signature/route.ts` - Server-side signature generation
- [x] 2. Update `useUpdateVehicleOptimistic.ts` - Use signed upload flow with signature
- [x] 3. Test and verify implementation

## Implementation Complete ✅

## Changes

### 1. API Route: `/api/cloudinary-signature/route.ts`
- Generate SHA-256 signature using Cloudinary API secret
- Return: signature, timestamp, api_key, upload_preset, folder
- Keep API secret secure server-side

### 2. Hook Update: `useUpdateVehicleOptimistic.ts`
- Fetch signature from `/api/cloudinary-signature` before upload
- Include signature params in FormData
- Use `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET='vehicle_uploads'`
- POST directly to Cloudinary

## Environment Variables Required

### Client-side (NEXT_PUBLIC_*):
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = 'vehicle_uploads'

### Server-side:
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`
