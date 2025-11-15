# Guide de Test du Flux de Réservation

## Objectif
Vérifier que la pré-sélection de l'établissement et de l'hébergement fonctionne correctement dans le processus de réservation.

## Prérequis
- Serveur de développement en cours d'exécution (`npm run dev`)
- Base de données MongoDB connectée
- Au moins un établissement et un hébergement disponibles dans la base de données

## Scénarios de Test

### Scénario 1 : Réservation depuis la Section "Nos Chambres"

#### Étapes
1. Ouvrir la page d'accueil : `http://localhost:3000`
2. Faire défiler jusqu'à la section "Nos Chambres & Maisons de Passage"
3. Localiser une carte d'hébergement disponible (badge vert "Disponible")
4. Cliquer sur le bouton "Réserver" (bouton ambre avec icône de calendrier)

#### Résultats Attendus
- ✅ Redirection vers `/booking?establishment=XXX&accommodation=YYY`
- ✅ L'établissement correspondant est automatiquement sélectionné (bordure bleue)
- ✅ L'hébergement est automatiquement sélectionné (bordure ambre)
- ✅ Badge "Sélectionné" visible sur les deux éléments
- ✅ Le bouton "Suivant" est activé (pas grisé)

#### Vérifications Techniques
```javascript
// Dans la console du navigateur
const params = new URLSearchParams(window.location.search);
console.log('Establishment ID:', params.get('establishment'));
console.log('Accommodation ID:', params.get('accommodation'));
```

---

### Scénario 2 : Réservation depuis la Page de Détails

#### Étapes
1. Depuis la section "Nos Chambres", cliquer sur "Voir détails"
2. Consulter les informations détaillées de l'hébergement
3. Cliquer sur le bouton "Réserver maintenant" dans la sidebar

#### Résultats Attendus
- ✅ Redirection vers `/booking?establishment=XXX&accommodation=YYY`
- ✅ Pré-sélection automatique de l'établissement et de l'hébergement
- ✅ Affichage correct des informations dans le formulaire
- ✅ Possibilité de passer directement à l'étape 2

---

### Scénario 3 : Hébergement Non Disponible

#### Étapes
1. Localiser un hébergement avec le badge rouge "Non disponible"
2. Tenter de cliquer sur le bouton "Réserver"

#### Résultats Attendus
- ✅ Le bouton est désactivé (opacité 50%)
- ✅ Curseur "not-allowed" au survol
- ✅ Tooltip "Hébergement non disponible" visible
- ✅ Aucune redirection possible

---

### Scénario 4 : Modification de la Sélection

#### Étapes
1. Arriver sur la page de réservation avec pré-sélection
2. Cliquer sur un autre établissement
3. Observer le rechargement des hébergements
4. Sélectionner un nouvel hébergement

#### Résultats Attendus
- ✅ La liste des hébergements se met à jour automatiquement
- ✅ L'ancienne sélection est désélectionnée
- ✅ La nouvelle sélection est mise en évidence
- ✅ Le bouton "Suivant" reste activé

---

### Scénario 5 : Navigation entre les Étapes

#### Étapes
1. Compléter l'étape 1 (sélection avec pré-sélection)
2. Cliquer sur "Suivant"
3. Remplir les informations du client principal
4. Cliquer sur "Suivant"
5. Vérifier le récapitulatif

#### Résultats Attendus
- ✅ Progression visible (barre de progression)
- ✅ Informations de l'hébergement affichées dans le récapitulatif
- ✅ Prix calculé correctement
- ✅ Possibilité de revenir en arrière avec "Précédent"

---

### Scénario 6 : Filtres et Tri

#### Étapes
1. Sur la page de réservation, sélectionner un établissement
2. Utiliser les filtres (type, prix, capacité)
3. Changer le mode de tri
4. Basculer entre vue grille et vue liste

#### Résultats Attendus
- ✅ Les hébergements sont filtrés correctement
- ✅ Le tri s'applique immédiatement
- ✅ Le compteur de résultats est mis à jour
- ✅ La pré-sélection reste visible si l'hébergement correspond aux filtres

---

## Tests de Régression

### Test 1 : URL Manuelle
```
http://localhost:3000/booking?establishment=INVALID_ID&accommodation=INVALID_ID
```
**Attendu** : Message d'erreur approprié, pas de crash

### Test 2 : URL Partielle
```
http://localhost:3000/booking?establishment=VALID_ID
```
**Attendu** : Établissement pré-sélectionné, liste des hébergements affichée

### Test 3 : URL Sans Paramètres
```
http://localhost:3000/booking
```
**Attendu** : Formulaire vide, sélection manuelle requise

---

## Tests de Performance

### Métriques à Vérifier
1. **Temps de chargement initial** : < 2 secondes
2. **Temps de réponse au clic** : < 100ms
3. **Fluidité des animations** : 60 FPS
4. **Taille des images** : Optimisées et lazy-loaded

### Outils Recommandés
- Chrome DevTools (Performance tab)
- Lighthouse (Performance audit)
- Network tab (vérifier les requêtes API)

---

## Tests Responsive

### Breakpoints à Tester
1. **Mobile** : 375px (iPhone SE)
2. **Tablette** : 768px (iPad)
3. **Desktop** : 1920px (Full HD)

### Points de Contrôle
- ✅ Boutons accessibles et cliquables
- ✅ Texte lisible sans zoom
- ✅ Images adaptées à la taille d'écran
- ✅ Formulaires utilisables au tactile

---

## Tests d'Accessibilité

### Vérifications
1. **Navigation au clavier** : Tab, Enter, Espace
2. **Lecteurs d'écran** : ARIA labels présents
3. **Contraste** : Ratio minimum 4.5:1
4. **Focus visible** : Indicateurs clairs

### Outils
- axe DevTools
- WAVE Browser Extension
- Lighthouse Accessibility Audit

---

## Checklist de Validation

### Fonctionnel
- [ ] Pré-sélection depuis la section chambres
- [ ] Pré-sélection depuis la page de détails
- [ ] Gestion des hébergements non disponibles
- [ ] Modification de sélection
- [ ] Navigation entre étapes
- [ ] Filtres et tri fonctionnels

### Visuel
- [ ] Animations fluides
- [ ] Couleurs cohérentes
- [ ] Icônes visibles
- [ ] Badges lisibles
- [ ] Responsive sur tous les écrans

### Technique
- [ ] Pas d'erreurs console
- [ ] Pas d'erreurs TypeScript
- [ ] API répond correctement
- [ ] URLs bien formées
- [ ] Données correctement passées

---

## Rapport de Bugs

### Template
```markdown
**Titre** : [Description courte]
**Scénario** : [Numéro du scénario]
**Étapes pour reproduire** :
1. ...
2. ...
3. ...

**Résultat attendu** : ...
**Résultat obtenu** : ...
**Navigateur** : Chrome 120 / Firefox 121 / Safari 17
**Capture d'écran** : [Si applicable]
**Logs console** : [Si applicable]
```

---

## Notes Importantes

### Données de Test
Assurez-vous d'avoir :
- Au moins 3 établissements différents
- Au moins 5 hébergements par établissement
- Mix d'hébergements disponibles et non disponibles
- Différents types (chambre, suite, maison)
- Différents modes de tarification (nuit, mois, heure)

### Environnement
- Node.js : v18+ ou v20+
- Next.js : 15.0.0+
- MongoDB : 6.0+
- Navigateurs : Dernières versions stables

---

**Date de création** : 15 novembre 2025
**Dernière mise à jour** : 15 novembre 2025
**Version** : 1.0.0
