# 🚀 Vercel Blob Image Upload System

## 📋 Overview

This document describes the enhanced image upload system optimized for Vercel deployment using `@vercel/blob`. The system provides automatic image optimization, CDN distribution, and seamless scalability.

## ✨ Features

### 🔧 Core Features
- **Automatic Image Optimization**: WebP conversion with 85% quality
- **Thumbnail Generation**: Small (150x150), Medium (300x300), Large (600x400)
- **CDN Distribution**: Global edge caching via Vercel's CDN
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Error Handling**: Comprehensive error handling and recovery
- **Batch Upload**: Support for multiple files (up to 10 per request)

### 🎯 Production Benefits
- **Scalability**: No server storage limitations
- **Performance**: Optimized images served from CDN
- **Reliability**: Vercel's infrastructure handles availability
- **Cost Efficiency**: Pay-per-use pricing model
- **Zero Maintenance**: No server storage management needed

## 🏗️ Architecture

### Components Structure
```
components/admin/
├── ImageUploadWrapper.tsx    # Smart wrapper (auto-detects environment)
├── ImageUploadBlob.tsx       # Vercel Blob implementation
└── ImageUpload.tsx          # Local storage fallback

hooks/
└── useImageUpload.ts        # Custom hook for upload logic

app/api/images/
├── upload-blob/route.ts     # Vercel Blob API endpoint
└── upload/route.ts         # Local storage API endpoint (fallback)
```

### Data Flow
```
User selects files
       ↓
ImageUploadWrapper detects environment
       ↓
useImageUpload hook processes files
       ↓
Files sent to /api/images/upload-blob
       ↓
Sharp optimizes images → WebP conversion
       ↓
Thumbnails generated (optional)
       ↓
Files uploaded to Vercel Blob
       ↓
CDN URLs returned to client
       ↓
Database updated with new URLs
```

## 🚀 Setup & Configuration

### 1. Environment Variables

Add to your `.env.local` and Vercel environment:

```bash
# Required for Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"

# Optional: Upload limits
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"
```

### 2. Get Vercel Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Create a new **Blob Store**
5. Copy the `BLOB_READ_WRITE_TOKEN`

### 3. Update Your Components

Replace existing ImageUpload usage:

```tsx
// Before
import ImageUpload from '@/components/admin/ImageUpload';

// After
import ImageUploadWrapper from '@/components/admin/ImageUploadWrapper';

// Usage remains the same
<ImageUploadWrapper
  images={images}
  onImagesChange={setImages}
  maxImages={10}
/>
```

## 📦 API Endpoints

### POST /api/images/upload-blob

Upload images with optimization and thumbnail generation.

**Request:**
```typescript
FormData {
  files: File[];           // Image files to upload
  generateThumbnails: boolean; // Optional, default: false
}
```

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    url: string;           // CDN URL of uploaded image
    filename: string;      // Generated filename
    size: number;          // Optimized file size
    optimized: boolean;    // Whether optimization was applied
    thumbnails?: {         // Generated thumbnails (if requested)
      small: string;
      medium: string;
      large: string;
    };
  }>;
  errors?: string[];       // Partial failure errors
}
```

### DELETE /api/images/upload-blob

Delete images from Vercel Blob.

**Request:**
```
DELETE /api/images/upload-blob?url=https://blob.vercel-storage.com/image1.webp&url=https://blob.vercel-storage.com/image2.webp
```

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    url: string;
    deleted: boolean;
  }>;
  errors?: Array<{
    url: string;
    error: string;
  }>;
}
```

## 🔄 Migration from Local Storage

### Automatic Migration

Run the migration script to move existing images:

```bash
# Dry run (preview changes)
npm run migrate:blob:dry-run

# Execute migration
npm run migrate:blob
```

### Manual Migration Steps

1. **Backup existing images**
   ```bash
   cp -r public/uploads/images backup/
   ```

2. **Run migration script**
   ```bash
   npm run migrate:blob
   ```

3. **Verify migration**
   - Check database for updated URLs
   - Test image loading on frontend
   - Verify thumbnails are generated

4. **Clean up (optional)**
   ```bash
   rm -rf public/uploads/images
   ```

## 🎨 Usage Examples

### Basic Upload Component

```tsx
import { ImageUploadWrapper } from '@/components/admin/ImageUploadWrapper';

function MyComponent() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <ImageUploadWrapper
      images={images}
      onImagesChange={setImages}
      maxImages={5}
    />
  );
}
```

### Custom Hook Usage

```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

function CustomUpload() {
  const { upload, isUploading, progress, error } = useImageUpload({
    generateThumbnails: true,
    onSuccess: (results) => {
      console.log('Uploaded:', results);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  const handleUpload = async (files: File[]) => {
    try {
      const results = await upload(files);
      // Handle successful upload
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isUploading && <div>Progress: {progress?.percentage}%</div>}
      {error && <div>Error: {error}</div>}
      {/* Your upload UI */}
    </div>
  );
}
```

### Thumbnail Usage

```tsx
import { getThumbnailUrl } from '@/hooks/useImageUpload';

function ImageGallery({ images }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image, index) => (
        <img
          key={index}
          src={getThumbnailUrl(image, 'medium')}
          alt={`Image ${index + 1}`}
          className="w-full h-32 object-cover rounded"
        />
      ))}
    </div>
  );
}
```

## 🔧 Configuration Options

### Upload Limits

```typescript
// In your component
<ImageUploadWrapper
  maxImages={10}           // Maximum number of images
  className="my-upload"    // Custom CSS classes
/>

// In useImageUpload hook
const { upload } = useImageUpload({
  maxFiles: 5,                    // Override max files
  maxFileSize: 5 * 1024 * 1024,   // 5MB limit
  generateThumbnails: true,       // Enable thumbnails
  onProgress: (progress) => {     // Progress callback
    console.log(`${progress.percentage}% complete`);
  }
});
```

### Image Optimization Settings

Modify in `/api/images/upload-blob/route.ts`:

```typescript
// Optimization settings
const optimized = await sharp(buffer)
  .resize(1920, 1080, { 
    fit: 'inside', 
    withoutEnlargement: true 
  })
  .webp({ 
    quality: 85,    // Adjust quality (1-100)
    effort: 4       // Compression effort (1-6)
  })
  .toBuffer();

// Thumbnail sizes
const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 400 },
  // Add custom sizes as needed
};
```

## 📊 Performance Metrics

### Before (Local Storage)
- ❌ Server storage limitations
- ❌ No image optimization
- ❌ No CDN distribution
- ❌ Manual thumbnail generation
- ❌ Server bandwidth usage

### After (Vercel Blob)
- ✅ Unlimited scalable storage
- ✅ Automatic WebP optimization (~25-35% size reduction)
- ✅ Global CDN distribution
- ✅ Automatic thumbnail generation
- ✅ Zero server bandwidth for images

### Typical Improvements
- **File Size**: 25-35% reduction with WebP
- **Load Time**: 40-60% faster with CDN
- **Scalability**: Unlimited storage capacity
- **Reliability**: 99.9% uptime SLA

## 🛠️ Troubleshooting

### Common Issues

1. **BLOB_READ_WRITE_TOKEN not configured**
   ```
   Error: Blob storage not configured
   ```
   **Solution**: Add the token to your environment variables

2. **Upload fails with large files**
   ```
   Error: File too large
   ```
   **Solution**: Check file size limits and adjust if needed

3. **Thumbnails not generating**
   ```
   Warning: Thumbnail generation failed
   ```
   **Solution**: Check Sharp installation and image format support

4. **Migration fails**
   ```
   Error: Failed to upload to blob
   ```
   **Solution**: Verify token permissions and network connectivity

### Debug Mode

Enable verbose logging:

```bash
# Migration with detailed logs
npm run migrate:blob:dry-run

# Check upload configuration
curl http://localhost:3000/api/images/upload-blob
```

## 🔒 Security Considerations

### File Validation
- File type validation (MIME type checking)
- File size limits enforced
- Malicious file detection via Sharp processing
- Sanitized filename generation

### Access Control
- Public read access for images
- Write access restricted to authenticated API
- Token-based authentication for Vercel Blob
- CORS headers properly configured

### Best Practices
- Always validate files on server-side
- Use generated filenames (UUIDs) to prevent conflicts
- Implement rate limiting for upload endpoints
- Monitor storage usage and costs

## 💰 Cost Optimization

### Vercel Blob Pricing
- **Free Tier**: 1GB storage, 100GB bandwidth
- **Pro**: $0.15/GB storage, $0.40/GB bandwidth
- **Enterprise**: Custom pricing

### Cost Reduction Tips
1. **Enable optimization**: Reduces storage and bandwidth costs
2. **Use thumbnails**: Serve appropriate sizes for different contexts
3. **Implement lazy loading**: Reduce unnecessary bandwidth
4. **Set cache headers**: Maximize CDN efficiency
5. **Clean up unused images**: Regular maintenance

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Configure `BLOB_READ_WRITE_TOKEN` in Vercel
- [ ] Test upload functionality locally
- [ ] Run migration script (dry-run first)
- [ ] Verify image optimization is working
- [ ] Test thumbnail generation

### Post-deployment
- [ ] Verify uploads work in production
- [ ] Check image loading performance
- [ ] Monitor error rates and logs
- [ ] Test image deletion functionality
- [ ] Validate CDN caching is active

### Monitoring
- [ ] Set up Vercel Blob usage alerts
- [ ] Monitor upload success rates
- [ ] Track image optimization metrics
- [ ] Watch for storage cost increases

## 📚 Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Next.js File Upload Best Practices](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body)
- [WebP Image Format Guide](https://developers.google.com/speed/webp)

---

**Need Help?** Check the troubleshooting section or create an issue in the project repository.