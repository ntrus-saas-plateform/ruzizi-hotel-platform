/**
 * Script pour générer toutes les icônes nécessaires à partir du logo principal
 * Utilise Sharp pour redimensionner et optimiser les icônes
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'ruzizi_black.png');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Définir toutes les tailles d'icônes nécessaires
const ICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateIcons() {
  console.log('🎨 Génération des icônes pour Ruzizi Hôtel...');
  
  // Vérifier que le logo source existe
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Logo source non trouvé:', LOGO_PATH);
    return;
  }

  try {
    // Générer chaque taille d'icône
    for (const { name, size } of ICON_SIZES) {
      const outputPath = path.join(PUBLIC_DIR, name);
      
      await sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fond transparent
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ Généré: ${name} (${size}x${size})`);
    }

    // Générer favicon.ico (format ICO)
    const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');
    await sharp(LOGO_PATH)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Fond blanc pour ICO
      })
      .png()
      .toFile(faviconPath);
    
    console.log('✅ Généré: favicon.ico (32x32)');

    console.log('\n🎉 Toutes les icônes ont été générées avec succès !');
    console.log('📱 Les erreurs 404 pour les icônes Apple Touch devraient maintenant être résolues.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };