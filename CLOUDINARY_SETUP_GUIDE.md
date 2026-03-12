# Cloudinary Setup Guide for Vehicle Image Uploads

This guide will help you configure Cloudinary for uploading vehicle images in your application.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Cloudinary credentials** (see detailed steps below)

3. **Fill in your `.env.local` file:**
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
   ```

4. **Restart your Next.js dev server:**
   ```bash
   npm run dev
   ```

## Detailed Setup Instructions

### Step 1: Sign Up / Log In to Cloudinary

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account or log in to your existing account
3. Once logged in, you'll be taken to the Dashboard

### Step 2: Find Your Cloud Name

1. In the Cloudinary Dashboard, look at the top section
2. You'll see your **Cloud Name** displayed prominently
3. Copy this value - it's what you'll use for `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

   Example: If your cloud URL is `https://res.cloudinary.com/mycompany/`, then your cloud name is `mycompany`

### Step 3: Create an Unsigned Upload Preset

This is required for direct browser uploads without authentication:

1. In the Cloudinary Dashboard, click on **Settings** (gear icon) in the top navigation
2. Click on **Upload** in the left sidebar
3. Scroll down to the **Upload presets** section
4. Click **Add upload preset**

#### Configure the Upload Preset:

| Setting | Value | Description |
|---------|-------|-------------|
| **Preset name** | `vehicle_uploads` (or any name you prefer) | This becomes your `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` |
| **Signing Mode** | **Unsigned** ⚠️ Important! | Allows direct browser uploads |
| **Folder** | (optional) `vehicles` | Organizes uploads into a folder |
| **Unique filename** | ✅ Enabled | Prevents filename collisions |
| **Overwrite** | ✅ Enabled | Allows updating existing images |
| **Image transformation** | (optional) `w_1280,h_1280,c_limit` | Resizes large images |

5. Click **Save**

### Step 4: Configure Environment Variables

1. Open your `.env.local` file
2. Add your credentials:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=vehicle_uploads
```

### Step 5: Verify Configuration

Run the diagnostic script:

```bash
node scripts/check-cloudinary-env.mjs
```

You should see:
```
✅ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: [your-cloud-name]
✅ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: [your-preset-name]
🎉 All environment variables are configured!
```

## Troubleshooting

### Error: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not configured"

**Cause:** The environment variable is missing or not loaded.

**Solution:**
1. Check that `.env.local` exists in your project root
2. Verify the variable name is exactly `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. Restart your Next.js dev server (environment variables are loaded at startup)
4. Run `node scripts/check-cloudinary-env.mjs` to verify

### Error: "Upload preset not found"

**Cause:** The upload preset name doesn't match what's in Cloudinary.

**Solution:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Verify the preset name matches exactly (case-sensitive)
3. Ensure the preset is set to **Unsigned** mode
4. Update your `.env.local` with the correct preset name

### Error: "Invalid signature" or "Unauthorized"

**Cause:** The upload preset might be set to "Signed" mode.

**Solution:**
1. In Cloudinary Dashboard, edit your upload preset
2. Change **Signing Mode** to **Unsigned**
3. Save and try again

### Images Not Showing After Upload

**Cause:** Next.js Image component needs Cloudinary domain configuration.

**Solution:**
Already configured in `next.config.mjs`:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/**',
    },
  ],
}
```

If images still don't show, check the browser console for CSP (Content Security Policy) errors.

## Security Considerations

### Why Unsigned Uploads?

We use **unsigned upload presets** because:
- ✅ Images upload directly from browser to Cloudinary (bypasses your server)
- ✅ No 502/504 errors from large file uploads
- ✅ Faster uploads (no server bottleneck)
- ✅ No authentication credentials exposed to browser

### Security Measures in Place

1. **Folder isolation:** Each category (Cars, Motorcycles) gets its own folder
2. **Unique filenames:** Each upload gets a unique ID with timestamp
3. **File type validation:** Only images are accepted
4. **Size limits:** Images are compressed client-side before upload
5. **CSP headers:** Configured to allow Cloudinary domains

### Recommended Additional Security

1. **Add upload limits in Cloudinary:**
   - Max file size: 5MB
   - Allowed formats: jpg, jpeg, png, webp

2. **Enable automatic moderation** (optional):
   - In Cloudinary settings, enable content moderation if needed

## Testing Your Setup

1. **Run the diagnostic:**
   ```bash
   node scripts/check-cloudinary-env.mjs
   ```

2. **Test the complete flow:**
   ```bash
   node scripts/test-cloudinary-unsigned-complete.mjs
   ```

3. **Try uploading a vehicle image** in the application

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations/month
- 25,000 total images

For a vehicle management system, this is typically sufficient for:
- ~5,000-10,000 vehicle images
- ~100-200 new uploads per month

## Next Steps

Once configured:
1. ✅ Vehicle images will upload directly to Cloudinary
2. ✅ No more 502 errors during image uploads
3. ✅ Images will be organized by category in Cloudinary folders
4. ✅ Vehicle list will auto-refresh after image updates

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Run `node scripts/check-cloudinary-env.mjs` to verify setup
3. Review this guide's troubleshooting section
4. Check Cloudinary's documentation: https://cloudinary.com/documentation
