# Image Display Troubleshooting Guide

## Problem: Base64 Images Displaying as Black or Not Loading

### Root Causes

1. **Large Image Sizes**: Uncompressed base64 images can be 5-10MB+, causing:
   - Browser memory issues
   - Slow page load times
   - Display failures (black images)

2. **Corrupted Base64 Data**: Invalid or incomplete base64 strings

3. **Browser Limitations**: Some browsers have limits on base64 image sizes

### Solutions Implemented

#### 1. Image Compression (NEW)

The `ImageUpload` component now automatically compresses images before storing:

```typescript
// Compresses images to max 1920x1080 with 85% JPEG quality
// Reduces file sizes by 70-90%
```

**Benefits:**
- Faster page loads
- Reduced storage
- Better browser compatibility
- Prevents black image issues

#### 2. Enhanced Error Handling

The `EstablishmentCard` component now includes:
- Detailed error logging
- Automatic fallback to default images
- Loading state indicators
- Image dimension validation

#### 3. Test Page

Visit `/test-images` to:
- View all establishment images
- See image metadata (size, format, etc.)
- Identify problematic images
- Debug display issues

### How to Fix Existing Images

#### Option 1: Re-upload Images (Recommended)

1. Go to Admin Panel → Establishments
2. Edit each establishment
3. Remove old images
4. Upload new images (will be auto-compressed)

#### Option 2: Run Migration Script

```bash
npx ts-node scripts/fix-images.ts
```

This script will:
- Validate all base64 images
- Remove corrupted images
- Keep only valid images

### Best Practices

1. **Image Upload**:
   - Use JPG format for photos
   - Keep original files under 5MB
   - Upload multiple smaller images vs one large image

2. **Production Deployment**:
   - Consider using cloud storage (Cloudinary, AWS S3)
   - Implement CDN for faster delivery
   - Use image optimization services

3. **Testing**:
   - Always test image uploads in different browsers
   - Check console for error messages
   - Use the `/test-images` page for debugging

### Monitoring

Check browser console for these logs:

```
✅ Image chargée: [establishment name]
   - naturalWidth: [width]
   - naturalHeight: [height]
   - complete: true

❌ Erreur chargement image pour: [establishment name]
   - src: [base64 preview]
   - error: Image failed to load
```

### Future Improvements

1. **Cloud Storage Integration**:
   - Implement Cloudinary or AWS S3
   - Store only URLs instead of base64
   - Automatic image optimization

2. **Progressive Loading**:
   - Implement lazy loading
   - Show thumbnails first
   - Load full images on demand

3. **Image Validation**:
   - Server-side validation
   - Format conversion
   - Size limits enforcement

### Troubleshooting Steps

If images still don't display:

1. **Check Console Logs**:
   ```
   Open DevTools → Console
   Look for 🖼️ and ❌ emoji logs
   ```

2. **Visit Test Page**:
   ```
   Navigate to /test-images
   Check image metadata
   ```

3. **Verify Database**:
   ```bash
   # Check image field in MongoDB
   db.establishments.findOne({}, { images: 1 })
   ```

4. **Re-upload Images**:
   - Delete problematic images
   - Upload fresh, optimized images

### Support

If issues persist:
1. Check browser console for errors
2. Verify network tab for failed requests
3. Test in different browsers
4. Check image file formats and sizes
