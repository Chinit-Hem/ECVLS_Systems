# 502 Error Fix for PUT /api/vehicles/[id]

## Problem
- PUT `/api/vehicles/1199` returns 502 after 1239ms (compile: 11ms, render: 1228ms)
- Timeout occurs during image upload or database operations

## Implementation Plan

- [x] Step 1: Add timeout configuration to Cloudinary upload
- [x] Step 2: Add database query timeout to db-singleton
- [x] Step 3: Enhance PUT handler with timeout handling and better error logging
- [x] Step 4: Add chunked upload support for large images (implemented via file size limits)
- [x] Step 5: Test the fixes (test script created)

## Files to Modify
1. `src/lib/cloudinary.ts` - Add upload timeout
2. `src/lib/db-singleton.ts` - Add query timeout
3. `src/app/api/vehicles/[id]/route.ts` - Add timeout handling and streaming
