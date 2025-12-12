# 🚀 Guide de Déploiement Vercel - Ruzizi Hôtel

## ❌ Problème Actuel
```
POST /api/images/upload 400 (Bad Request)
Upload error: Error: Upload failed
```

## 🔍 Cause
L'application utilise l'ancien système d'upload local qui ne fonctionne pas en production Vercel. Il faut configurer Vercel Blob.

## ✅ Solution Rapide

### 1. **Configurer Vercel Blob Token**

#### Dans Vercel Dashboard :
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `ruzizi-hotel-platform`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter la variable :

```bash
Name: BLOB_READ_WRITE_TOKEN
Value: vercel_blob_rw_xxxxxxxxxx
```

#### Obtenir le Token :
1. Dans Vercel Dashboard → **Storage**
2. Créer un nouveau **Blob Store** si pas encore fait
3. Copier le `BLOB_READ_WRITE_TOKEN`

### 2. **Redéployer l'Application**
```bash
# Option 1: Push automatique
git add .
git commit -m "Fix: Configure Vercel Blob for production"
git push origin main

# Option 2: Redéploiement manuel
# Dans Vercel Dashboard → Deployments → Redeploy
```

### 3. **Vérifier la Configuration**
Après déploiement, l'interface d'upload affichera :
- ✅ **Vercel Blob Storage** - Configured (vert)
- Au lieu de ❌ **Token Required** (rouge)

## 🔧 Variables d'Environnement Requises

### Production (Vercel)
```bash
# Obligatoire pour upload d'images
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"

# Existantes (à conserver)
MONGODB_URI="mongodb+srv://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://ruzizihotels.com"
# ... autres variables
```

## 🎯 Fonctionnalités Après Configuration

### Upload d'Images Optimisé
- ✅ **Conversion WebP** automatique (-25-35% taille)
- ✅ **Génération de thumbnails** (3 tailles)
- ✅ **Distribution CDN** globale
- ✅ **Cache optimisé** (1 an)
- ✅ **Retry automatique** en cas d'échec

### Interface Utilisateur
- ✅ **Progress bar** en temps réel
- ✅ **Drag & drop** multiple
- ✅ **Validation** types et tailles
- ✅ **Gestion d'erreurs** détaillée
- ✅ **Diagnostic** de configuration

## 🚨 Diagnostic des Problèmes

### Si l'upload ne fonctionne toujours pas :

1. **Vérifier le Token**
   - Aller sur `/admin` (interface d'upload)
   - Vérifier que "Vercel Blob Storage - Configured" s'affiche

2. **Vérifier les Logs Vercel**
   - Vercel Dashboard → Functions → View Logs
   - Chercher les erreurs dans `/api/images/upload-blob`

3. **Tester la Configuration**
   - Ouvrir la console navigateur
   - Aller sur `https://ruzizihotels.com/api/images/config`
   - Vérifier que `blobConfigured: true`

## 📊 Migration des Images Existantes

### Après Configuration Blob
```bash
# En local (optionnel)
npm run migrate:blob:dry-run  # Voir ce qui sera migré
npm run migrate:blob          # Migrer les images
```

### Avantages de la Migration
- **Performance** : Images servies depuis CDN
- **Optimisation** : Conversion WebP automatique
- **Scalabilité** : Stockage illimité
- **Fiabilité** : 99.9% uptime

## ✅ Checklist de Déploiement

- [ ] **Token configuré** : `BLOB_READ_WRITE_TOKEN` dans Vercel
- [ ] **Application redéployée** : Dernier commit poussé
- [ ] **Interface testée** : Upload fonctionne sur le site
- [ ] **Diagnostic vert** : Configuration validée
- [ ] **Images optimisées** : WebP + thumbnails générés

## 🎉 Résultat Final

Après configuration :
- ✅ **Upload d'images fonctionnel** en production
- ✅ **Performance optimisée** avec CDN
- ✅ **Scalabilité illimitée** 
- ✅ **Maintenance zéro**

---

**Support** : Si problème persiste, vérifier les logs Vercel et la configuration du token.