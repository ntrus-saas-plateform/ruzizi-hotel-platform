/**
 * Script to validate and fix base64 images in the database
 * Run with: npx ts-node scripts/fix-images.ts
 */

import { connectDB } from '@/lib/db';
import { EstablishmentModel } from '@/models/Establishment.model';

async function validateBase64Image(base64: string): Promise<boolean> {
  try {
    // Check if it's a valid base64 image string
    if (!base64.startsWith('data:image/')) {
      console.log('❌ Not a valid data URI');
      return false;
    }

    // Check if it has the comma separator
    if (!base64.includes(',')) {
      console.log('❌ Missing comma separator');
      return false;
    }

    // Extract the base64 part
    const base64Data = base64.split(',')[1];
    
    // Check if base64 data exists
    if (!base64Data || base64Data.length === 0) {
      console.log('❌ Empty base64 data');
      return false;
    }

    // Try to decode to verify it's valid base64
    try {
      atob(base64Data);
    } catch (e) {
      console.log('❌ Invalid base64 encoding');
      return false;
    }

    console.log('✅ Valid base64 image');
    return true;
  } catch (error) {
    console.log('❌ Validation error:', error);
    return false;
  }
}

async function fixImages() {
  try {
    await connectDB();
    console.log('🔌 Connected to database');

    const establishments = await EstablishmentModel.find({});
    console.log(`📊 Found ${establishments.length} establishments`);

    let fixedCount = 0;
    let invalidCount = 0;

    for (const establishment of establishments) {
      console.log(`\n🏨 Checking ${establishment.name}...`);
      
      if (!establishment.images || establishment.images.length === 0) {
        console.log('  ⚠️  No images');
        continue;
      }

      const validImages: string[] = [];
      let hasInvalidImages = false;

      for (let i = 0; i < establishment.images.length; i++) {
        const image = establishment.images[i];
        console.log(`  📸 Image ${i + 1}/${establishment.images.length} (${Math.round(image.length / 1024)}KB)`);
        
        const isValid = await validateBase64Image(image);
        
        if (isValid) {
          validImages.push(image);
        } else {
          hasInvalidImages = true;
          invalidCount++;
          console.log(`  ❌ Invalid image ${i + 1} - will be removed`);
        }
      }

      if (hasInvalidImages) {
        establishment.images = validImages;
        await establishment.save();
        fixedCount++;
        console.log(`  ✅ Fixed - kept ${validImages.length}/${establishment.images.length} valid images`);
      } else {
        console.log(`  ✅ All images valid`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Total establishments: ${establishments.length}`);
    console.log(`  - Establishments fixed: ${fixedCount}`);
    console.log(`  - Invalid images removed: ${invalidCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixImages();
