# Quick Fix Guide - Cloudinary Image Upload

## The Problem
Your system shows "Upload preset not found" error when trying to upload vehicle images.

## The Solution (5 Minutes)

### Step 1: Create Upload Preset in Cloudinary (3 minutes)
1. Open https://cloudinary.com/console in your browser
2. Log in to your account
3. Click **Settings** (gear icon at top)
4. Click **Upload** in left menu
5. Scroll down to **Upload presets**
6. Click **Add upload preset**
7. Fill in:
   - **Preset name**: `vehicle_uploads`
   - **Signing Mode**: `UNSIGNED` ⚠️ (Important!)
   - Leave other settings as default
8. Click **Save**

### Step 2: Restart Your Server (1 minute)
1. Stop your Next.js dev server (Ctrl+C)
2. Run: `npm run dev`
3. Wait for server to start

### Step 3: Test (1 minute)
Run this command to verify everything works:
```bash
node scripts/test-upload-complete.mjs
```

You should see: ✅ UPLOAD SUCCESSFUL!

## What I've Already Fixed For You

✅ Enhanced error messages - Now shows clear instructions when preset is missing
✅ Verification script - `node scripts/verify-cloudinary-setup.mjs` checks your setup
✅ Test script - `node scripts/test-upload-complete.mjs` tests actual upload
✅ Browser diagnostic - Type `diagnoseCloudinary()` in browser console if needed

## After You Create the Preset

Once you complete Step 1 and 2 above:
- Vehicle image uploads will work
- Images will display in the data list
- Everything will function normally

## If You Still Have Issues

1. Run: `node scripts/verify-cloudinary-setup.mjs`
2. Check the error message
3. Follow the instructions shown

## Need Help?

The error messages now include direct links and step-by-step fixes. Just follow what the error says!
