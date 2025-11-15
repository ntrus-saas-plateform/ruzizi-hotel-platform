# Guide Rapide - Correction du Bouton de Réservation

## Ce qui a été fait

### 1. Amélioration de l'extraction de l'ID d'établissement
Le code essaie maintenant plusieurs méthodes pour extraire l'ID :
- `establishmentId._id` (format MongoDB standard)
- `establishmentId.id` (format après transformation)
- `establishmentId.toString()` (si c'est un ObjectId)
- `establishmentId` directement (si c'est une string)

### 2. Logs de débogage détaillés
Ouvrez la console du navigateur (F12) et vous verrez :
```
🔍 Processing accommodation: A01
  Raw establishmentId: {id: '6918517785a6c0fccc1205b4', name: 'Ruzizi Hôtel...'}
  Type: object
  Object - _id: undefined
  Object - id: 6918517785a6c0fccc1205b4
  Object - name: Ruzizi Hôtel (Kibenga Large)
✅ Extracted estId: 6918517785a6c0fccc1205b4
✅ Extracted estName: Ruzizi Hôtel (Kibenga Large)
📦 Normalized: {id: '691882260dae687fed0c3548', name: 'A01', establishmentId: '6918517785a6c0fccc1205b4', isAvailable: true}
```

### 3. Gestion de la disponibilité
Le code vérifie maintenant :
- `accom.isAvailable` (si défini)
- OU `accom.status === 'available'` (fallback)

## Comment Tester

### Étape 1 : Ouvrir la page
```bash
# Assurez-vous que le serveur tourne
npm run dev

# Ouvrez dans le navigateur
http://localhost:3000
```

### Étape 2 : Ouvrir la console
- Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
- Allez dans l'onglet **Console**

### Étape 3 : Faire défiler jusqu'à "Nos Chambres"
Vous devriez voir les logs de débogage s'afficher automatiquement

### Étape 4 : Vérifier le bouton
1. Localisez la carte "A01" (ou autre hébergement)
2. Le bouton "Réserver" devrait être **actif** (pas grisé)
3. Passez la souris dessus - tooltip devrait dire "Réserver cet hébergement"

### Étape 5 : Cliquer sur "Réserver"
Vous devriez voir dans la console :
```
Book button clicked for: A01
establishmentId: 6918517785a6c0fccc1205b4
accommodation id: 691882260dae687fed0c3548
isAvailable: true
Navigating to: /booking?establishment=6918517785a6c0fccc1205b4&accommodation=691882260dae687fed0c3548
```

### Étape 6 : Vérifier la redirection
La page devrait rediriger vers `/booking` avec :
- L'établissement "Ruzizi Hôtel (Kibenga Large)" pré-sélectionné
- L'hébergement "A01" pré-sélectionné

## Si le bouton est toujours désactivé

### Vérification 1 : Regarder les logs
Dans la console, cherchez :
```
✅ Extracted estId: undefined
```

Si vous voyez `undefined`, le problème vient de l'extraction de l'ID.

### Vérification 2 : Regarder le message d'erreur
Si vous voyez sous la carte :
```
⚠️ Établissement non défini pour cet hébergement
```

Cela confirme que `establishmentId` est `undefined`.

### Vérification 3 : Inspecter le bouton
1. Clic droit sur le bouton "Réserver"
2. "Inspecter l'élément"
3. Vérifier l'attribut `disabled` :
   - Si `disabled=""` ou `disabled="true"` → Le bouton est désactivé
   - Vérifier le `title` pour voir la raison

## Solutions de Secours

### Solution 1 : Forcer l'ID (Temporaire)
Si l'extraction ne fonctionne toujours pas, modifiez temporairement le code :

```typescript
// Dans AccommodationsSection.tsx, ligne ~75
const estId = '6918517785a6c0fccc1205b4'; // TEMPORAIRE - ID de votre établissement
```

### Solution 2 : Vérifier la base de données
```bash
# Connectez-vous à MongoDB
mongosh

# Utilisez la base de données
use ruzizi-hotel

# Vérifiez la structure d'un hébergement
db.accommodations.findOne({}, {name: 1, establishmentId: 1, status: 1, isAvailable: 1})
```

### Solution 3 : Recréer l'hébergement
Si l'hébergement n'a pas d'`establishmentId` valide :
1. Allez dans l'admin : `http://localhost:3000/admin/accommodations`
2. Modifiez l'hébergement "A01"
3. Sélectionnez à nouveau l'établissement
4. Sauvegardez

## Résultat Attendu

Après ces corrections, vous devriez pouvoir :
1. ✅ Voir le bouton "Réserver" actif (pas grisé)
2. ✅ Cliquer dessus sans problème
3. ✅ Être redirigé vers `/booking` avec les bons paramètres
4. ✅ Voir l'établissement et l'hébergement pré-sélectionnés

## Nettoyage (Après Test)

Une fois que tout fonctionne, vous pouvez :
1. Retirer les `console.log` de débogage
2. Retirer le message d'avertissement rouge
3. Garder uniquement la logique d'extraction de l'ID

---

**Besoin d'aide ?**
Si le problème persiste, copiez tous les logs de la console et partagez-les pour diagnostic.
