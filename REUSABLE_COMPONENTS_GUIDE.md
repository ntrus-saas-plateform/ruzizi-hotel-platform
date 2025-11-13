# 🧩 Guide des Composants Réutilisables

## 📋 Vue d'Ensemble

Ce document décrit les composants réutilisables à créer pour améliorer la maintenabilité et réduire la duplication de code dans la plateforme Ruzizi Hotel.

---

## 🎯 Composants Prioritaires

### 1. StatsCard Component

**Emplacement**: `components/shared/StatsCard.tsx`

**Props**:
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string; // e.g., "from-blue-500 to-blue-600"
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}
```

**Utilisation**:
```tsx
<StatsCard
  title="Total Réservations"
  value={1234}
  icon={<CalendarIcon />}
  gradient="from-blue-500 to-blue-600"
  trend={{ value: 12, isPositive: true }}
/>
```

**Avantages**:
- Réutilisable dans Dashboard, Analytics, Reports, etc.
- Design cohérent
- Animations centralisées

---

### 2. FilterPanel Component

**Emplacement**: `components/shared/FilterPanel.tsx`

**Props**:
```typescript
interface FilterPanelProps {
  title?: string;
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  onReset: () => void;
  showMobileToggle?: boolean;
}

interface FilterConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}
```

**Utilisation**:
```tsx
<FilterPanel
  title="Filtres"
  filters={[
    { name: 'search', label: 'Recherche', type: 'text', placeholder: 'Rechercher...' },
    { name: 'status', label: 'Statut', type: 'select', options: statusOptions },
    { name: 'date', label: 'Date', type: 'daterange' }
  ]}
  onFilterChange={handleFilterChange}
  onReset={handleReset}
  showMobileToggle
/>
```

**Avantages**:
- Filtres cohérents partout
- Toggle mobile intégré
- Validation centralisée

---

### 3. ResponsiveTable Component

**Emplacement**: `components/shared/ResponsiveTable.tsx`

**Props**:
```typescript
interface ResponsiveTableProps<T> {
  columns: ColumnConfig[];
  data: T[];
  onRowClick?: (row: T) => void;
  mobileCardRender?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}
```

**Utilisation**:
```tsx
<ResponsiveTable
  columns={[
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Statut', render: (value) => <StatusBadge status={value} /> }
  ]}
  data={users}
  onRowClick={handleRowClick}
  mobileCardRender={(user) => <UserCard user={user} />}
  loading={loading}
/>
```

**Avantages**:
- Vue desktop et mobile automatique
- Tri intégré
- Loading states

---

### 4. Modal Component

**Emplacement**: `components/shared/Modal.tsx`

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}
```

**Utilisation**:
```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Créer un utilisateur"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Annuler</Button>
      <Button variant="primary" onClick={onSubmit}>Créer</Button>
    </>
  }
>
  <UserForm />
</Modal>
```

**Avantages**:
- Backdrop avec blur
- Animations d'entrée/sortie
- Fermeture ESC et click outside
- Scroll lock

---

### 5. Button Component

**Emplacement**: `components/shared/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Utilisation**:
```tsx
<Button
  variant="primary"
  size="md"
  icon={<PlusIcon />}
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Créer
</Button>
```

**Avantages**:
- Styles cohérents
- Loading state intégré
- Animations hover

---

### 6. Badge Component

**Emplacement**: `components/shared/Badge.tsx`

**Props**:
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Utilisation**:
```tsx
<Badge variant="success">Actif</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="danger">Rejeté</Badge>
```

---

### 7. LoadingSpinner Component

**Emplacement**: `components/shared/LoadingSpinner.tsx`

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}
```

**Utilisation**:
```tsx
<LoadingSpinner size="lg" message="Chargement..." />
<LoadingSpinner fullScreen />
```

---

### 8. EmptyState Component

**Emplacement**: `components/shared/EmptyState.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Utilisation**:
```tsx
<EmptyState
  icon={<InboxIcon />}
  title="Aucune réservation"
  description="Commencez par créer votre première réservation"
  action={{
    label: "Nouvelle réservation",
    onClick: () => router.push('/bookings/create')
  }}
/>
```

---

### 9. Pagination Component

**Emplacement**: `components/shared/Pagination.tsx`

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}
```

**Utilisation**:
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showPageNumbers
/>
```

---

### 10. Toast/Alert Component

**Emplacement**: `components/shared/Toast.tsx`

**Props**:
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: () => void;
}
```

**Utilisation**:
```tsx
<Toast
  type="success"
  message="Utilisateur créé avec succès"
  duration={3000}
  onClose={() => setShowToast(false)}
/>
```

---

## 🎣 Hooks Personnalisés

### 1. useFilters Hook

**Emplacement**: `hooks/useFilters.ts`

```typescript
export function useFilters<T>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);
  
  const updateFilter = (key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters(initialFilters);
  };
  
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };
  
  return { filters, updateFilter, resetFilters, hasActiveFilters };
}
```

---

### 2. usePagination Hook

**Emplacement**: `hooks/usePagination.ts`

```typescript
export function usePagination(totalItems: number, itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}
```

---

### 3. useModal Hook

**Emplacement**: `hooks/useModal.ts`

```typescript
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);
  
  return { isOpen, open, close, toggle };
}
```

---

### 4. useToast Hook

**Emplacement**: `hooks/useToast.ts`

```typescript
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = (type: ToastType, message: string, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };
  
  const success = (message: string) => showToast('success', message);
  const error = (message: string) => showToast('error', message);
  const warning = (message: string) => showToast('warning', message);
  const info = (message: string) => showToast('info', message);
  
  return { toasts, success, error, warning, info };
}
```

---

### 5. useDebounce Hook

**Emplacement**: `hooks/useDebounce.ts`

```typescript
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

---

## 📁 Structure Recommandée

```
components/
├── shared/
│   ├── StatsCard.tsx
│   ├── FilterPanel.tsx
│   ├── ResponsiveTable.tsx
│   ├── Modal.tsx
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── Pagination.tsx
│   ├── Toast.tsx
│   └── index.ts (exports)
├── frontoffice/
│   └── ...
└── admin/
    └── ...

hooks/
├── useFilters.ts
├── usePagination.ts
├── useModal.ts
├── useToast.ts
├── useDebounce.ts
└── index.ts (exports)

lib/
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
└── constants/
    ├── colors.ts
    ├── gradients.ts
    └── breakpoints.ts
```

---

## 🎨 Constantes de Design

### colors.ts
```typescript
export const colors = {
  primary: {
    blue: '#2563EB',
    indigo: '#4F46E5',
    purple: '#7C3AED',
    green: '#059669',
    amber: '#D97706',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  }
};
```

### gradients.ts
```typescript
export const gradients = {
  blue: 'from-blue-500 to-blue-600',
  indigo: 'from-indigo-500 to-indigo-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-green-600',
  amber: 'from-amber-500 to-amber-600',
};
```

---

## 🚀 Plan d'Implémentation

### Phase 1: Composants de Base (1-2 jours)
1. Button
2. Badge
3. LoadingSpinner
4. Modal

### Phase 2: Composants de Données (2-3 jours)
1. StatsCard
2. ResponsiveTable
3. Pagination
4. EmptyState

### Phase 3: Composants de Filtrage (1-2 jours)
1. FilterPanel
2. SearchInput
3. DateRangePicker

### Phase 4: Hooks (1 jour)
1. useFilters
2. usePagination
3. useModal
4. useToast
5. useDebounce

### Phase 5: Refactoring (2-3 jours)
1. Remplacer les composants dupliqués
2. Tester sur toutes les pages
3. Optimiser les performances
4. Documentation

---

## ✅ Checklist de Migration

- [ ] Créer le dossier `components/shared`
- [ ] Créer le dossier `hooks`
- [ ] Implémenter Button component
- [ ] Implémenter Badge component
- [ ] Implémenter LoadingSpinner component
- [ ] Implémenter Modal component
- [ ] Implémenter StatsCard component
- [ ] Implémenter FilterPanel component
- [ ] Implémenter ResponsiveTable component
- [ ] Implémenter Pagination component
- [ ] Implémenter EmptyState component
- [ ] Implémenter Toast component
- [ ] Créer useFilters hook
- [ ] Créer usePagination hook
- [ ] Créer useModal hook
- [ ] Créer useToast hook
- [ ] Créer useDebounce hook
- [ ] Migrer Dashboard
- [ ] Migrer Bookings
- [ ] Migrer Expenses
- [ ] Migrer Analytics
- [ ] Migrer Reports
- [ ] Migrer Users
- [ ] Tester toutes les pages
- [ ] Optimiser les performances
- [ ] Documenter l'utilisation

---

## 📚 Ressources

### Documentation
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Next.js](https://nextjs.org/docs)

### Exemples de Code
Tous les composants actuels peuvent servir de référence pour créer les composants réutilisables.

---

*Document créé le: Novembre 13, 2025*
*Dernière mise à jour: Novembre 13, 2025*
