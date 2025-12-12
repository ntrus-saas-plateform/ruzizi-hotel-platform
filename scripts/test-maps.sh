#!/bin/bash

# Script pour tester les cartes interactives
echo "🗺️  Test des cartes interactives Ruzizi Hôtel"
echo "=============================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ Node.js et npm sont installés"

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Corriger les données de localisation
echo "🔧 Correction des données de localisation..."
node scripts/fix-location-data.js

# Créer des établissements de test si nécessaire
echo "🏨 Création d'établissements de test..."
node scripts/fix-location-data.js create-test

echo ""
echo "🎯 Tests disponibles:"
echo "1. Page de test des cartes: http://localhost:3000/test-maps"
echo "2. Page d'accueil avec cartes: http://localhost:3000"
echo "3. Établissements avec cartes: http://localhost:3000/establishments"
echo ""
echo "🚀 Démarrage du serveur de développement..."
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""

# Démarrer le serveur de développement
npm run dev