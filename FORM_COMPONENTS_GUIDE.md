# 📝 Guide des Composants de Formulaire Améliorés

## 🎯 Objectif

Améliorer la visibilité et l'expérience utilisateur de tous les champs de saisie dans l'application Ruzizi Hôtel.

---

## ✨ Nouveautés

### Améliorations Globales (Automatiques)

Tous les inputs existants bénéficient automatiquement des améliorations suivantes :

- ✅ **Texte plus visible** : Police plus grande (16px) et plus grasse (font-weight: 500)
- ✅ **Padding généreux** : Plus d'espace pour une meilleure lisibilité
- ✅ **Bordures améliorées** : Bordures de 2px pour une meilleure définition
- ✅ **Focus state** : Anneau de focus amber avec animation fluide
- ✅ **Placeholder visible** : Couleur optimisée pour une meilleure visibilité
- ✅ **Transitions fluides** : Animations douces sur tous les états
- ✅ **Mode sombre** : Support automatique du mode sombre
- ✅ **Mobile optimisé** : Taille de police de 16px pour éviter le zoom sur iOS

---

## 🧩 Nouveaux Composants

### 1. Input

Composant d'input amélioré avec support des icônes et messages d'erreur.

#### Import

```typescript
import { Input } from '@/components/ui';
// ou
import Input from '@/components/ui/Input';
```

#### Utilisation de Base

```tsx
<Input
  label="Nom complet"
  type="text"
  placeholder="Entrez votre nom"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>
```

#### Avec Icône

```tsx
<Input
  label="Email"
  type="email"
  placeholder="exemple@email.com"
  leftIcon={
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  }
/>
```

#### Avec Erreur

```tsx
<Input
  label="Mot de passe"
  type="password"
  error="Le mot de passe doit contenir au moins 6 caractères"
/>
```

#### Props Disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label du champ |
| `error` | string | - | Message d'erreur |
| `helperText` | string | - | Texte d'aide |
| `leftIcon` | ReactNode | - | Icône à gauche |
| `rightIcon` | ReactNode | - | Icône à droite |
| `variant` | 'default' \| 'filled' \| 'outlined' | 'default' | Style du champ |
| `inputSize` | 'sm' \| 'md' \| 'lg' | 'md' | Taille du champ |
| ...rest | InputHTMLAttributes | - | Toutes les props HTML standard |

---

### 2. Textarea

Composant textarea amélioré.

#### Import

```typescript
import { Textarea } from '@/components/ui';
```

#### Utilisation

```tsx
<Textarea
  label="Message"
  placeholder="Écrivez votre message..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  rows={5}
  helperText="Minimum 10 caractères"
/>
```

#### Props Disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label du champ |
| `error` | string | - | Message d'erreur |
| `helperText` | string | - | Texte d'aide |
| `variant` | 'default' \| 'filled' \| 'outlined' | 'default' | Style du champ |
| `textareaSize` | 'sm' \| 'md' \| 'lg' | 'md' | Taille du champ |
| `rows` | number | 4 | Nombre de lignes |
| ...rest | TextareaHTMLAttributes | - | Toutes les props HTML standard |

---

### 3. Select

Composant select amélioré avec icône de flèche personnalisée.

#### Import

```typescript
import { Select } from '@/components/ui';
```

#### Utilisation avec Options

```tsx
<Select
  label="Pays"
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  options={[
    { value: '', label: 'Sélectionnez un pays' },
    { value: 'BI', label: 'Burundi' },
    { value: 'RW', label: 'Rwanda' },
  ]}
/>
```

#### Utilisation avec Children

```tsx
<Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="">Sélectionnez un rôle</option>
  <option value="admin">Administrateur</option>
  <option value="manager">Manager</option>
  <option value="staff">Staff</option>
</Select>
```

#### Props Disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label du champ |
| `error` | string | - | Message d'erreur |
| `helperText` | string | - | Texte d'aide |
| `variant` | 'default' \| 'filled' \| 'outlined' | 'default' | Style du champ |
| `selectSize` | 'sm' \| 'md' \| 'lg' | 'md' | Taille du champ |
| `options` | Array<{value, label}> | - | Options du select |
| ...rest | SelectHTMLAttributes | - | Toutes les props HTML standard |

---

## 🎨 Variantes

### Default (Par défaut)

```tsx
<Input variant="default" placeholder="Style par défaut" />
```

- Fond blanc
- Bordure grise
- Focus amber

### Filled (Rempli)

```tsx
<Input variant="filled" placeholder="Style rempli" />
```

- Fond gris clair
- Bordure grise claire
- Devient blanc au focus

### Outlined (Contour)

```tsx
<Input variant="outlined" placeholder="Style contour" />
```

- Fond transparent
- Bordure épaisse (2px)
- Focus amber

---

## 📏 Tailles

### Small (sm)

```tsx
<Input inputSize="sm" placeholder="Petit input" />
```

- Padding: 0.5rem 0.75rem
- Font-size: 0.875rem (14px)

### Medium (md) - Par défaut

```tsx
<Input inputSize="md" placeholder="Input moyen" />
```

- Padding: 0.75rem 1rem
- Font-size: 1rem (16px)

### Large (lg)

```tsx
<Input inputSize="lg" placeholder="Grand input" />
```

- Padding: 1rem 1.25rem
- Font-size: 1.125rem (18px)

---

## 🎯 Exemples Complets

### Formulaire de Connexion

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation et soumission
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Adresse email"
        type="email"
        placeholder="exemple@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />

      <Input
        label="Mot de passe"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      />

      <button
        type="submit"
        className="w-full bg-amber-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors"
      >
        Se connecter
      </button>
    </form>
  );
}
```

### Formulaire de Réservation

```tsx
'use client';

import { useState } from 'react';
import { Input, Select, Textarea } from '@/components/ui';

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomType: '',
    specialRequests: '',
  });

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nom complet"
          type="text"
          placeholder="Votre nom"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="votre@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Téléphone"
          type="tel"
          placeholder="+257 XX XX XX XX"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />

        <Select
          label="Nombre de personnes"
          value={formData.guests}
          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
          options={[
            { value: '1', label: '1 personne' },
            { value: '2', label: '2 personnes' },
            { value: '3', label: '3 personnes' },
            { value: '4', label: '4 personnes' },
          ]}
        />

        <Input
          label="Date d'arrivée"
          type="date"
          value={formData.checkIn}
          onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
          required
        />

        <Input
          label="Date de départ"
          type="date"
          value={formData.checkOut}
          onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
          required
        />
      </div>

      <Select
        label="Type de chambre"
        value={formData.roomType}
        onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
        required
        options={[
          { value: '', label: 'Sélectionnez un type' },
          { value: 'standard', label: 'Chambre Standard' },
          { value: 'deluxe', label: 'Chambre Deluxe' },
          { value: 'suite', label: 'Suite' },
        ]}
      />

      <Textarea
        label="Demandes spéciales"
        placeholder="Avez-vous des demandes particulières ?"
        value={formData.specialRequests}
        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
        rows={4}
      />

      <button
        type="submit"
        className="w-full bg-amber-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors"
      >
        Réserver maintenant
      </button>
    </form>
  );
}
```

---

## 🔧 Migration des Inputs Existants

### Avant (Input HTML standard)

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email
  </label>
  <input
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
    placeholder="exemple@email.com"
  />
</div>
```

### Après (Composant Input)

```tsx
<Input
  label="Email"
  type="email"
  placeholder="exemple@email.com"
/>
```

**Avantages :**
- ✅ Moins de code
- ✅ Styles cohérents
- ✅ Gestion automatique des erreurs
- ✅ Support des icônes intégré
- ✅ Meilleure accessibilité

---

## 📱 Responsive Design

Tous les composants sont automatiquement responsive :

- **Mobile** : Taille de police de 16px (évite le zoom sur iOS)
- **Tablet** : Adaptation automatique
- **Desktop** : Pleine largeur avec max-width

---

## 🌙 Mode Sombre

Le mode sombre est automatiquement supporté via les styles globaux :

```css
@media (prefers-color-scheme: dark) {
  /* Styles automatiques pour le mode sombre */
}
```

---

## ♿ Accessibilité

Tous les composants respectent les standards d'accessibilité :

- ✅ Labels associés correctement
- ✅ Messages d'erreur avec `role="alert"`
- ✅ Support du clavier complet
- ✅ Focus visible et clair
- ✅ Contraste de couleurs conforme WCAG 2.1

---

## 🎨 Personnalisation

### Couleurs

Les couleurs peuvent être personnalisées via Tailwind :

```tsx
<Input
  className="focus:ring-blue-500/20 focus:border-blue-500"
  // ...
/>
```

### Styles Personnalisés

```tsx
<Input
  className="bg-gradient-to-r from-purple-50 to-pink-50"
  // ...
/>
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Visibilité du texte** | ⚠️ Difficile à lire | ✅ Excellent |
| **Taille de police** | 14px | 16px |
| **Padding** | 0.5rem | 0.875rem |
| **Bordure** | 1px | 2px |
| **Focus** | Ring simple | Ring + animation |
| **Erreurs** | Texte simple | Icône + message |
| **Icônes** | ❌ Non supporté | ✅ Supporté |
| **Variantes** | ❌ Non | ✅ 3 variantes |
| **Tailles** | ❌ Non | ✅ 3 tailles |

---

## 🚀 Prochaines Étapes

1. ✅ Créer les composants de base (Input, Textarea, Select)
2. ✅ Ajouter les styles globaux améliorés
3. ⏳ Migrer progressivement les formulaires existants
4. ⏳ Ajouter plus de composants (Checkbox, Radio, Switch)
5. ⏳ Créer une bibliothèque de patterns de formulaires

---

## 📞 Support

Pour toute question ou suggestion d'amélioration :

- 📖 Consultez ce guide
- 🔍 Voir `components/ui/FormExample.tsx` pour des exemples
- 💬 Contactez l'équipe de développement

---

**Version:** 1.0.0  
**Date:** 15 janvier 2024  
**Status:** ✅ Prêt à l'emploi

**✨ Formulaires Améliorés pour une Meilleure Expérience Utilisateur ! ✨**
