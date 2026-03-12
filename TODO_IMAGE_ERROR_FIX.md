# Image Loading Error Fix Plan

## Information Gathered

### Error Details
- **File**: `src/app/components/ui/ImageInput.tsx` at line 401
- **Error**: Failed to load image from Cloudinary URL
- **URL Pattern**: `https://res.cloudinary.com/dgntrakv6/image/upload/...`
- **Current Behavior**: Logs error to console, sets error state, falls back to placeholder

### Root Cause Analysis
1. The error state is set but never cleared when the fallback image loads successfully
2. The `preview.url` remains the original failed URL in state, causing confusion
3. No retry mechanism or better error recovery exists
4. The error message persists even after fallback image displays

## Problems Identified

1. **Error State Persistence**: When image fails to load, error is set but not cleared when placeholder loads
2. **State Inconsistency**: `preview.url` still shows the failed URL even though fallback is displayed
3. **Poor UX**: User sees error message even when fallback image is visible
4. **No Recovery**: User cannot retry loading the original image

## Plan

### File: `src/app/components/ui/ImageInput.tsx`

#### Changes to make:

1. **Fix onError handler** (lines 399-404):
   - Clear error state when fallback image loads successfully
   - Add separate state to track if we're showing fallback
   - Update preview state to reflect fallback usage

2. **Add onLoad handler for fallback**:
   - Clear error when placeholder successfully loads
   - Track fallback state separately

3. **Improve error state management**:
   - Add `isUsingFallback` state
   - Clear error when user interacts with component
   - Better error message that indicates fallback is being used

4. **Add retry functionality**:
   - Allow user to retry loading the original image
   - Show retry button when image fails

## Implementation Steps

1. [x] Add `isUsingFallback` state to track fallback usage
2. [x] Add `failedUrl` state to track the failed URL for retry
3. [x] Update `onError` handler to set fallback state and track failed URL
4. [x] Add `onLoad` handler for fallback image to clear error state
5. [x] Add `handleRetry` function to retry loading the original image
6. [x] Update `handleRemove` to reset fallback states
7. [x] Update UI to show retry button when image fails
8. [x] Ensure error is cleared when user uploads new image or enters new URL

## Testing Steps

1. [ ] Test with invalid Cloudinary URL
2. [ ] Verify fallback image displays
3. [ ] Verify error message clears when fallback loads
4. [ ] Test retry functionality
5. [ ] Test with valid image to ensure no regression

## Summary of Changes

### File: `src/app/components/ui/ImageInput.tsx`

**New State Variables:**
- `isUsingFallback`: Tracks when the placeholder image is being shown
- `failedUrl`: Stores the original URL that failed to load

**Updated Handlers:**
- `onError`: Now sets `failedUrl` and `isUsingFallback` instead of just logging
- `onLoad`: Clears error when fallback image loads successfully
- `handleRemove`: Resets fallback states when image is removed
- `handleRetry`: New function to retry loading the original image

**UI Updates:**
- Image `src` now conditionally uses placeholder when `isUsingFallback` is true
- Error message section now includes a "Retry" button when fallback is active
- Better error state management with visual feedback

## Benefits

1. **Better UX**: Users see a placeholder instead of a broken image
2. **Clear Feedback**: Error message appears but can be dismissed via retry
3. **Recovery Option**: Users can retry loading the original image
4. **No Console Spam**: Error is handled gracefully without breaking the UI
