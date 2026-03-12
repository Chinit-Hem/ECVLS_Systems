/**
 * Client-Side Image Compression Utility
 * Compresses images in the browser before uploading to reduce file size and upload time
 */

/**
 * Compress an image file using canvas
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise with compressed file and metadata
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
  } = {}
): Promise<{
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Use better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: type,
              lastModified: Date.now()
            });
            
            const originalSize = file.size;
            const compressedSize = blob.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
            
            console.log('[ClientCompression] Image compressed:', {
              originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
              compressedSize: `${(compressedSize / 1024).toFixed(2)}KB`,
              compressionRatio: `${compressionRatio.toFixed(1)}%`,
              dimensions: `${width}x${height}`
            });
            
            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio,
              width,
              height
            });
          },
          type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for compression'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if image compression is needed
 * @param file - The image file to check
 * @param maxSizeMB - Maximum size in MB before compression is required
 * @returns boolean indicating if compression is recommended
 */
export function shouldCompressImage(file: File, maxSizeMB: number = 1): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
}

/**
 * Get image dimensions without loading full image
 * @param file - The image file
 * @returns Promise with width and height
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Process image for upload with automatic compression if needed
 * @param file - The image file
 * @param options - Compression options
 * @returns Processed file ready for upload
 */
export async function processImageForUpload(
  file: File,
  options: {
    maxWidth?: number;
    quality?: number;
    autoCompress?: boolean;
    maxSizeMB?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    quality = 0.7,
    autoCompress = true,
    maxSizeMB = 1
  } = options;

  // Check if compression is needed
  if (!autoCompress || !shouldCompressImage(file, maxSizeMB)) {
    console.log('[ClientCompression] Image size OK, no compression needed:', {
      size: `${(file.size / 1024).toFixed(2)}KB`,
      maxSize: `${maxSizeMB}MB`
    });
    return file;
  }

  try {
    const result = await compressImage(file, {
      maxWidth,
      quality,
      type: file.type || 'image/jpeg'
    });

    // Only use compressed if it's actually smaller
    if (result.compressedSize < result.originalSize) {
      console.log('[ClientCompression] Using compressed image');
      return result.file;
    } else {
      console.log('[ClientCompression] Compressed image not smaller, using original');
      return file;
    }
  } catch (error) {
    console.warn('[ClientCompression] Compression failed, using original:', error);
    return file;
  }
}
