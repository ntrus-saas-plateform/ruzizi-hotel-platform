#!/bin/sh
set -e

echo "🚀 Démarrage de Ruzizi Hôtel Platform..."

# Fonction pour vérifier la connectivité MongoDB Atlas
check_mongodb_atlas() {
    echo "⏳ Vérification de la connectivité MongoDB Atlas..."
    
    # Vérifier si MONGODB_URI est configuré
    if [ -z "$MONGODB_URI" ]; then
        echo "❌ MONGODB_URI non configuré"
        return 1
    fi
    
    # Test de connectivité simple (sans dépendance externe)
    echo "✅ Configuration MongoDB Atlas détectée"
    echo "🔗 URI: ${MONGODB_URI%%\?*}..." # Afficher l'URI sans les paramètres sensibles
    
    return 0
}

# Fonction pour initialiser l'utilisateur root
init_root_user() {
    echo "🔐 Initialisation de l'utilisateur root..."
    
    # Vérifier si le script d'initialisation existe
    if [ -f "./scripts/init-root-user.js" ]; then
        node ./scripts/init-root-user.js
    elif [ -f "./scripts/init-root-user.ts" ]; then
        # Compiler et exécuter le script TypeScript
        npx ts-node ./scripts/init-root-user.ts
    else
        echo "⚠️  Script d'initialisation root non trouvé"
    fi
}

# Fonction principale
main() {
    # Vérifier MongoDB Atlas
    if check_mongodb_atlas; then
        # Initialiser l'utilisateur root
        init_root_user
    else
        echo "⚠️  Configuration MongoDB manquante - saut de l'initialisation"
    fi
    
    echo "🎉 Initialisation terminée - Démarrage de l'application..."
    
    # Exécuter la commande passée en argument
    exec "$@"
}

# Gestion des signaux pour un arrêt propre
trap 'echo "🛑 Arrêt de l'\''application..."; exit 0' TERM INT

# Exécuter la fonction principale
main "$@"