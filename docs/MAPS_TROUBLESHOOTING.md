# 🗺️ Guide de Dépannage des Cartes - Ruzizi Hôtel

## 🚨 Problème: "Ce contenu a été bloqué"

### Causes Possibles
1. **Restrictions CORS** - Google Maps bloque les iframes depuis certains domaines
2. **Politique de sécurité** - Navigateur ou réseau bloque le contenu externe
3. **Clé API manquante** - Google Maps nécessite une clé API pour certains usages
4. **Géolocalisation restreinte** - Certaines régions ont des restrictions

### Solutions Implémentées

#### 1. **SimpleMap** (Recommandé)
```tsx
import SimpleMap from '@/components/maps/SimpleMap';

<SimpleMap
  location={{
    lat: -3.3614,
    lng: 29.3599,
    name: 'Ruzizi Hôtel',
    address: "Avenue de l'Université, Bujumbura",
    city: 'bujumbura'
  }}
  height="400px"
  showNearbyPlaces={true}
/>
```

**Avantages:**
- ✅ Toujours fonctionnel (pas d'iframe)
- ✅ Design attractif et professionnel
- ✅ Boutons d'action directs vers Google Maps
- ✅ Lieux d'intérêt intégrés
- ✅ Pas de problème d'hydratation

#### 2. **RobustMap** (Fallback Automatique)
```tsx
import RobustMap from '@/components/maps/RobustMap';

<RobustMap
  location={{
    lat: -3.3614,
    lng: 29.3599,
    name: 'Ruzizi Hôtel',
    address: "Avenue de l'Université, Bujumbura"
  }}
  height="400px"
/>
```

**Fonctionnalités:**
- 🔄 Détection automatique des blocages
- 🗺️ Fallback Google Maps → OpenStreetMap → Statique
- ⚡ Test de connectivité intégré
- 🛡️ Gestion d'erreurs robuste

#### 3. **InteractiveMap** (Version Originale)
```tsx
import InteractiveMap from '@/components/maps/InteractiveMap';

<InteractiveMap
  location={{
    lat: -3.3614,
    lng: 29.3599,
    name: 'Ruzizi Hôtel',
    address: "Avenue de l'Université, Bujumbura"
  }}
  height="400px"
  showControls={true}
  showDirections={true}
/>
```

**Usage:** Uniquement si les iframes Google Maps fonctionnent

## 🔧 Configuration Recommandée

### Pour Production
```tsx
// Utiliser SimpleMap par défaut
import SimpleMap from '@/components/maps/SimpleMap';

// Ou RobustMap pour plus de fonctionnalités
import RobustMap from '@/components/maps/RobustMap';
```

### Pour Développement/Test
```tsx
// Utiliser la page de test
// Visitez: /test-maps
import MapTestComponent from '@/components/maps/MapTestComponent';
```

## 🌐 Alternatives aux Cartes Intégrées

### 1. **Liens Directs Google Maps**
```tsx
const openGoogleMaps = () => {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, '_blank');
};
```

### 2. **Google Street View**
```tsx
const openStreetView = () => {
  const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m6!1e1`;
  window.open(url, '_blank');
};
```

### 3. **Directions**
```tsx
const getDirections = () => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};
```

## 🔍 Diagnostic des Problèmes

### Script de Vérification
```bash
# Tester les cartes
node scripts/check-hydration.js

# Test complet
node scripts/final-test.js
```

### Vérifications Manuelles

#### 1. **Test de Connectivité**
```javascript
// Dans la console du navigateur
fetch('https://www.google.com/maps', { method: 'HEAD', mode: 'no-cors' })
  .then(() => console.log('Google Maps accessible'))
  .catch(() => console.log('Google Maps bloqué'));
```

#### 2. **Test d'Iframe**
```html
<!-- Test simple dans une page HTML -->
<iframe 
  src="https://www.google.com/maps?q=-3.3614,29.3599&output=embed"
  width="400" 
  height="300">
</iframe>
```

#### 3. **Vérification CORS**
```javascript
// Vérifier les headers CORS
fetch('https://www.google.com/maps?q=-3.3614,29.3599', { method: 'HEAD' })
  .then(response => console.log('Headers:', response.headers))
  .catch(error => console.log('Erreur CORS:', error));
```

## 🛠️ Solutions par Environnement

### Développement Local
```tsx
// Utiliser SimpleMap pour éviter les problèmes
<SimpleMap location={location} />
```

### Staging/Test
```tsx
// Utiliser RobustMap pour tester les fallbacks
<RobustMap location={location} />
```

### Production
```tsx
// SimpleMap recommandé pour la fiabilité
<SimpleMap location={location} showNearbyPlaces={true} />
```

## 📱 Compatibilité Mobile

### Problèmes Courants
- Iframes bloquées sur certains navigateurs mobiles
- Politique de sécurité plus stricte
- Connexion limitée

### Solutions
```tsx
// SimpleMap s'adapte automatiquement
<SimpleMap 
  location={location}
  height="300px" // Hauteur réduite sur mobile
  showNearbyPlaces={true}
/>
```

## 🔐 Sécurité et Confidentialité

### Headers de Sécurité
```typescript
// next.config.ts
headers: [
  {
    key: 'Content-Security-Policy',
    value: "frame-src 'self' https://www.google.com https://www.openstreetmap.org;"
  }
]
```

### Politique de Confidentialité
- SimpleMap ne charge pas de contenu externe automatiquement
- L'utilisateur contrôle quand ouvrir Google Maps
- Pas de tracking automatique

## 📊 Monitoring et Analytics

### Métriques à Surveiller
```javascript
// Taux de succès des cartes
const mapSuccessRate = successfulMaps / totalMapLoads;

// Provider utilisé le plus souvent
const providerStats = {
  google: googleMapsLoads,
  openstreetmap: osmLoads,
  static: staticMapsLoads
};
```

### Logs Utiles
```javascript
console.log('Map provider:', currentProvider);
console.log('Map error:', error);
console.log('Fallback triggered:', fallbackReason);
```

## 🚀 Optimisations Futures

### Court Terme
- [ ] Cache des réponses de test de connectivité
- [ ] Préchargement des alternatives
- [ ] Optimisation des images de fallback

### Long Terme
- [ ] Intégration avec d'autres providers (Mapbox, HERE)
- [ ] Cartes hors ligne avec service worker
- [ ] Géolocalisation utilisateur

## 📞 Support

### En Cas de Problème
1. **Vérifier la console** - Erreurs JavaScript
2. **Tester avec SimpleMap** - Solution de fallback
3. **Utiliser /test-maps** - Page de diagnostic
4. **Vérifier la connectivité** - Réseau et CORS

### Contacts
- **Développement**: Équipe technique Ruzizi Hôtel
- **Documentation**: README_MAPS_FIXES.md
- **Tests**: /test-maps

---

**Dernière mise à jour:** Décembre 2024  
**Version:** 2.1.0  
**Statut:** ✅ Solutions Multiples Disponibles