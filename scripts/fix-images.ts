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
      return false;
    }

    // Check if it has the comma separator
    if (!base64.includes(',')) {
      return false;
    }

    // Extract the base64 part
    const base64Data = base64.split(',')[1];
    
    // Check if base64 data exists
    if (!base64Data || base64Data.length === 0) {
      return false;
    }

    // Try to decode to verify it's valid base64
    try {
      atob(base64Data);
    } catch (e) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function fixImages() {
  try {
    await connectDB();
    const establishments = await EstablishmentModel.find({});
    let fixedCount = 0;
    let invalidCount = 0;

    for (const establishment of establishments) {
      if (!establishment.images || establishment.images.length === 0) {
        continue;
      }

      const validImages: string[] = [];
      let hasInvalidImages = false;

      for (let i = 0; i < establishment.images.length; i++) {
        const image = establishment.images[i];
        console.log(`  Vérification image ${i + 1}/${establishment.images.length} (${(image.length / 1024).toFixed(2)}KB)`);

        const isValid = await validateBase64Image(image);

        if (isValid) {
          validImages.push(image);
        } else {
          hasInvalidImages = true;
          invalidCount++;
          console.log(`    ❌ Image ${i + 1} invalide - supprimée`);
        }
      }

      if (hasInvalidImages) {
        establishment.images = validImages;
        await establishment.save();
        fixedCount++;
        console.log(`✅ ${establishment.name}: ${establishment.images.length} images valides gardées`);
      } else {
        console.log(`✅ ${establishment.name}: toutes les images sont valides`);
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`  Établissements corrigés: ${fixedCount}`);
    console.log(`  Images invalides supprimées: ${invalidCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixImages();
