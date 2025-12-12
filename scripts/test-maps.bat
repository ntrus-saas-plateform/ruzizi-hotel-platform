@echo off
REM Script pour tester les cartes interactives sur Windows
echo 🗺️  Test des cartes interactives Ruzizi Hôtel
echo ==============================================

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    pause
    exit /b 1
)

REM Vérifier si npm est installé
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé
    pause
    exit /b 1
)

echo ✅ Node.js et npm sont installés

REM Vérifier les dépendances
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
)

REM Corriger les données de localisation
echo 🔧 Correction des données de localisation...
node scripts/fix-location-data.js

REM Créer des établissements de test si nécessaire
echo 🏨 Création d'établissements de test...
node scripts/fix-location-data.js create-test

echo.
echo 🎯 Tests disponibles:
echo 1. Page de test des cartes: http://localhost:3000/test-maps
echo 2. Page d'accueil avec cartes: http://localhost:3000
echo 3. Établissements avec cartes: http://localhost:3000/establishments
echo.
echo 🚀 Démarrage du serveur de développement...
echo    Appuyez sur Ctrl+C pour arrêter
echo.

REM Démarrer le serveur de développement
npm run dev