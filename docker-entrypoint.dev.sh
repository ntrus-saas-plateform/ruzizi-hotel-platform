#!/bin/sh
set -e

echo "🚀 Démarrage de Ruzizi Hôtel Platform (Développement)..."

# Fonction pour vérifier MongoDB (Atlas ou local)
check_mongodb() {
    echo "⏳ Vérification de MongoDB..."
    
    if [ -z "$MONGODB_URI" ]; then
        echo "❌ MONGODB_URI non configuré"
        return 1
    fi
    
    # Vérifier si c'est MongoDB Atlas ou local
    if echo "$MONGODB_URI" | grep -q "mongodb+srv://"; then
        echo "✅ Configuration MongoDB Atlas détectée"
    elif echo "$MONGODB_URI" | grep -q "mongodb://"; then
        echo "✅ Configuration MongoDB locale détectée"
        
        # Pour MongoDB local, attendre qu'il soit prêt
        MONGO_HOST=$(echo $MONGODB_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
        MONGO_PORT=$(echo $MONGODB_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ -n "$MONGO_HOST" ] && [ -n "$MONGO_PORT" ]; then
            echo "⏳ Attente de MongoDB sur $MONGO_HOST:$MONGO_PORT..."
            while ! nc -z $MONGO_HOST $MONGO_PORT 2>/dev/null; do
                echo "MongoDB pas encore prêt - attente..."
                sleep 2
            done
            echo "✅ MongoDB local est prêt!"
        fi
    else
        echo "⚠️  Format MONGODB_URI non reconnu"
    fi
    
    return 0
}

# Fonction pour initialiser l'utilisateur root en développement
init_root_user_dev() {
    echo "🔐 Initialisation de l'utilisateur root (développement)..."
    
    # En développement, on peut être plus permissif
    if [ -f "./scripts/init-root-user.js" ]; then
        node ./scripts/init-root-user.js || echo "⚠️  Échec de l'initialisation root (continuons...)"
    elif [ -f "./scripts/init-root-user.ts" ]; then
        npx ts-node ./scripts/init-root-user.ts || echo "⚠️  Échec de l'initialisation root (continuons...)"
    else
        echo "⚠️  Script d'initialisation root non trouvé"
    fi
}

# Fonction principale
main() {
    # Vérifier MongoDB
    if check_mongodb; then
        # Initialiser l'utilisateur root (non bloquant en dev)
        init_root_user_dev
    else
        echo "⚠️  Problème MongoDB - continuons quand même..."
    fi
    
    echo "🎉 Initialisation terminée - Démarrage en mode développement..."
    
    # Exécuter la commande passée en argument
    exec "$@"
}

# Gestion des signaux pour un arrêt propre
trap 'echo "🛑 Arrêt de l'\''application de développement..."; exit 0' TERM INT

# Exécuter la fonction principale
main "$@"