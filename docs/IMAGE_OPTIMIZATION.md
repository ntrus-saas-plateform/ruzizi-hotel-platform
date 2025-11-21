# Optimisation des Images - Guide Next.js

## 🎯 Capacités Natives de Next.js

Next.js fournit automatiquement une optimisation d'images puissante sans configuration complexe.

### ✅ Fonctionnalités Automatiques

1. **Formats Modernes** : Conversion automatique en WebP/AVIF
2. **Redimensionnement** : Images adaptées à la taille d'écran
3. **Lazy Loading** : Chargement différé automatique
4. **Cache Intelligent** : Cache optimisé côté navigateur

### 🚀 Comment Utiliser

#### Remplacer `<img>` par `<Image>`

```tsx
// ❌ Avant (non optimisé)
<img src="/hotel-room.jpg" alt="Chambre d'hôtel" />

// ✅ Après (optimisé)
import Image from 'next/image';

<Image
  src="/hotel-room.jpg"
  alt="Chambre d'hôtel"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### Propriétés Importantes

- **`sizes`** : Décrit comment l'image s'affiche selon la taille d'écran
- **`priority`** : Pour les images au-dessus de la ligne de flottaison
- **`placeholder="blur"`** : Effet de flou pendant le chargement

### 📱 Configuration Mobile-First

La configuration actuelle optimise automatiquement pour :

```typescript
// next.config.ts
images: {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 3600, // 1 heure de cache
}
```

### 🌐 Images Externes (Unsplash, etc.)

```typescript
// Automatiquement optimisé pour les domaines autorisés
<Image
  src="https://images.unsplash.com/photo-123..."
  alt="Image externe"
  width={800}
  height={600}
/>
```

### 📊 Bénéfices Mesurés

- **Taille réduite** : -25-35% avec WebP/AVIF
- **Chargement plus rapide** : Images servies à la bonne taille
- **SEO amélioré** : Core Web Vitals optimisés
- **Mobile optimisé** : Tailles adaptées automatiquement

### 🔧 Migration Recommandée

1. **Remplacer progressivement** tous les `<img>` par `<Image>`
2. **Ajouter les propriétés `sizes`** appropriées
3. **Utiliser `priority`** pour les images hero
4. **Tester les performances** avec Lighthouse

### 🚀 CDN Optionnel (Plus Tard)

Pour un CDN réel, ajouter simplement :

```bash
# .env.local
NEXT_PUBLIC_CDN_URL=https://cdn.ruzizihotel.com
```

Puis modifier les sources d'images selon vos besoins.

---

**Résultat** : Optimisation automatique et puissante sans complexité ! 🎉