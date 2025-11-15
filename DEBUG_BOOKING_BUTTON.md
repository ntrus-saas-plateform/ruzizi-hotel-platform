# Guide de Débogage - Bouton de Réservation Non Cliquable

## Problème
Le bouton "Réserver" dans la section "Nos Chambres & Maisons de Passage" n'est pas cliquable.

## Causes Possibles

### 1. Données Manquantes dans la Base de Données
**Symptôme** : Aucun hébergement ne s'affiche ou les boutons sont tous désactivés

**Vérification** :
```bash
# Exécuter le script de test
cd ruzizi-hotel-platform
node test-api.js
```

**Solution** : Créer des hébergements via l'interface admin ou importer des données de test

---

### 2. establishmentId Non Défini
**Symptôme** : Message "⚠️ Établissement non défini pour cet hébergement" sous le bouton

**Vérification dans la console du navigateur** :
```javascript
// Ouvrir la console (F12) et vérifier les logs
// Vous devriez voir :
// "Processing accommodation: [nom] establishmentId: [valeur]"
// "Extracted estId: [id] estName: [nom]"
```

**Solution** :
1. Vérifier que chaque hébergement a un `establishmentId` valide dans la base de données
2. S'assurer que l'API populate correctement les données

---

### 3. Hébergement Non Disponible
**Symptôme** : Badge rouge "Non disponible" sur la carte

**Vérification** :
- Vérifier le champ `status` de l'hébergement dans la base de données
- Doit être `"available"` pour être réservable

**Solution** :
```javascript
// Dans MongoDB ou via l'admin
db.accommodations.updateMany(
  { status: { $ne: "available" } },
  { $set: { status: "available" } }
)
```

---

### 4. Problème de Normalisation des Données
**Symptôme** : Les logs montrent `establishmentId: undefined` ou `establishmentId: null`

**Vérification dans la console** :
```javascript
// Chercher ces logs :
console.log('Accommodations API response:', accomData);
console.log('Normalized accommodations:', normalizedAccommodations);
```

**Solution** : Vérifier la structure des données retournées par l'API

---

## Étapes de Débogage

### Étape 1 : Vérifier le Serveur
```bash
# S'assurer que le serveur est en cours d'exécution
npm run dev

# Vérifier qu'il écoute sur http://localhost:3000
```

### Étape 2 : Tester l'API Directement
```bash
# Exécuter le script de test
node test-api.js

# Ou tester manuellement dans le navigateur
# Ouvrir : http://localhost:3000/api/public/accommodations
```

### Étape 3 : Vérifier la Console du Navigateur
1. Ouvrir la page d'accueil
2. Ouvrir les DevTools (F12)
3. Aller dans l'onglet Console
4. Chercher les logs suivants :
   - `Accommodations API response:`
   - `Processing accommodation:`
   - `Extracted estId:`
   - `Normalized accommodations:`

### Étape 4 : Tester le Clic sur le Bouton
1. Cliquer sur un bouton "Réserver"
2. Vérifier les logs dans la console :
   - `Book button clicked for:`
   - `establishmentId:`
   - `accommodation id:`
   - `isAvailable:`
   - `Navigating to:`

### Étape 5 : Vérifier l'État du Bouton
Inspecter le bouton dans les DevTools :
```html
<!-- Le bouton devrait ressembler à ça -->
<button
  disabled="false"
  class="... bg-gradient-to-r from-amber-600 ..."
  title="Réserver cet hébergement"
>
```

Si `disabled="true"`, vérifier pourquoi :
- `!accom.isAvailable` → Hébergement non disponible
- `!accom.establishmentId` → Établissement non défini

---

## Solutions Rapides

### Solution 1 : Forcer la Disponibilité (Temporaire)
Dans `AccommodationsSection.tsx`, ligne ~240 :
```typescript
// Temporairement, forcer isAvailable à true pour tester
const testAccom = {
  ...accom,
  isAvailable: true // TEMPORAIRE - À RETIRER
};
```

### Solution 2 : Utiliser un ID d'Établissement par Défaut (Temporaire)
```typescript
const estId = accom.establishmentId || 'DEFAULT_ESTABLISHMENT_ID';
```

### Solution 3 : Vérifier la Structure de l'API
Modifier temporairement `fetchData` pour logger toute la réponse :
```typescript
console.log('RAW API Response:', JSON.stringify(accomData, null, 2));
```

---

## Checklist de Vérification

### Base de Données
- [ ] Au moins un établissement existe
- [ ] Au moins un hébergement existe
- [ ] Chaque hébergement a un `establishmentId` valide
- [ ] Le champ `status` est `"available"` ou `isAvailable` est `true`
- [ ] Les IDs sont des ObjectId MongoDB valides

### API
- [ ] `/api/public/accommodations` retourne des données
- [ ] `/api/public/establishments` retourne des données
- [ ] Les données sont correctement populées (establishmentId contient l'objet complet)
- [ ] Pas d'erreurs 500 dans les logs du serveur

### Frontend
- [ ] Les logs de console s'affichent correctement
- [ ] `normalizedAccommodations` contient des données
- [ ] `establishmentId` est extrait correctement
- [ ] Le bouton n'est pas désactivé
- [ ] Le clic déclenche la navigation

---

## Commandes Utiles

### Vérifier MongoDB
```bash
# Se connecter à MongoDB
mongosh

# Utiliser la base de données
use ruzizi-hotel

# Compter les hébergements
db.accommodations.countDocuments()

# Voir un exemple d'hébergement
db.accommodations.findOne()

# Vérifier les établissements
db.establishments.countDocuments()
db.establishments.findOne()
```

### Nettoyer et Reconstruire
```bash
# Nettoyer le cache Next.js
rm -rf .next

# Réinstaller les dépendances
npm install

# Redémarrer le serveur
npm run dev
```

### Logs du Serveur
```bash
# Voir les logs en temps réel
npm run dev | grep -i "accommodation\|establishment"
```

---

## Exemple de Données Valides

### Hébergement
```json
{
  "_id": "673a1234567890abcdef1234",
  "name": "Chambre Deluxe",
  "type": "standard_room",
  "establishmentId": "673b5678901234cdef567890",
  "status": "available",
  "isAvailable": true,
  "pricing": {
    "basePrice": 75000,
    "currency": "BIF"
  },
  "capacity": {
    "maxGuests": 2
  }
}
```

### Établissement
```json
{
  "_id": "673b5678901234cdef567890",
  "name": "Hôtel Ruzizi",
  "location": {
    "city": "Bujumbura",
    "country": "Burundi"
  }
}
```

---

## Contact Support

Si le problème persiste après avoir suivi ce guide :

1. **Capturer les informations** :
   - Copier tous les logs de la console
   - Faire une capture d'écran de la page
   - Noter les étapes exactes pour reproduire

2. **Vérifier les fichiers modifiés** :
   - `components/frontoffice/AccommodationsSection.tsx`
   - `app/api/public/accommodations/route.ts`
   - `services/Accommodation.service.ts`

3. **Créer un rapport de bug** avec :
   - Description du problème
   - Logs de la console
   - Résultat de `node test-api.js`
   - Version de Node.js (`node --version`)
   - Version de Next.js (dans `package.json`)

---

**Dernière mise à jour** : 15 novembre 2025
**Version** : 1.0.0
