# Image Upload Enhancement - Implementation Plan

## Overview
Update vehicle form image upload to support link uploads, drag & drop, and copy-paste functionality everywhere.

## Tasks

### 1. Update `useVehicleForm.ts`
- [x] Rename `handleImageFile` to `handleImageChange` to support both File and string (URL)
- [x] Update `uploadedImageFile` state to `uploadedImage` that can be `File | string | null`
- [x] Update `onSubmit` callback signature to handle both File and string
- [x] Update `handleRemoveImage` to clear both file and URL

### 2. Update `VehicleFormUnified.tsx`
- [x] Import `ImageInput` component
- [x] Replace custom `ImageSection` with `ImageInput`
- [x] Update props to use new `handleImageChange` handler
- [x] Ensure proper layout integration (compact vs default)

### 3. Verify Integration
- [x] Check all pages using VehicleFormUnified work correctly
- [x] Test drag & drop functionality
- [x] Test URL paste functionality
- [x] Test Ctrl+V paste functionality

## Features Enabled
- ✅ Drag & drop file upload
- ✅ Click to select file  
- ✅ Paste image URL
- ✅ Ctrl+V paste (both images and URLs)
- ✅ Image preview with remove option
- ✅ File size validation
- ✅ URL validation
