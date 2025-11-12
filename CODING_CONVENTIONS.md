# Coding Conventions - Ruzizi Hôtel Platform

## General Principles

1. **Write Clean, Readable Code**: Code should be self-documenting
2. **Follow DRY**: Don't Repeat Yourself
3. **KISS**: Keep It Simple, Stupid
4. **SOLID Principles**: Especially Single Responsibility
5. **Type Safety**: Leverage TypeScript's type system

## TypeScript

### Type Definitions

```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
}

// ❌ Bad: Using 'any'
const user: any = { ... };

// ✅ Good: Use 'unknown' when type is truly unknown
const data: unknown = await fetchData();
```

### Function Signatures

```typescript
// ✅ Good: Explicit return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good: Async functions
async function fetchUser(id: string): Promise<User | null> {
  // ...
}
```

## React Components

### Component Structure

```typescript
// ✅ Good: Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### Hooks

```typescript
// ✅ Good: Custom hooks
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user
  }, []);

  return { user, loading };
}
```

## Naming Conventions

### Variables and Functions

```typescript
// ✅ Good: camelCase for variables and functions
const userName = 'John Doe';
function calculateTotalPrice() { }

// ❌ Bad: snake_case or PascalCase for variables
const user_name = 'John Doe';
const UserName = 'John Doe';
```

### Constants

```typescript
// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_UPLOAD_SIZE = 10485760;
const API_BASE_URL = 'https://api.example.com';
```

### Components and Classes

```typescript
// ✅ Good: PascalCase
class UserService { }
function UserProfile() { }
```

### Files

```typescript
// Components: PascalCase
Button.tsx
UserProfile.tsx

// Utilities: camelCase
formatDate.ts
calculatePrice.ts

// Services: PascalCase with .service.ts
Auth.service.ts
Booking.service.ts

// Models: PascalCase with .model.ts
User.model.ts
Establishment.model.ts
```

## Code Organization

### Imports

```typescript
// ✅ Good: Organized imports
// 1. External libraries
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. Internal modules
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/formatDate';

// 3. Types
import type { User } from '@/types/User.types';

// 4. Styles (if any)
import styles from './Component.module.css';
```

### Exports

```typescript
// ✅ Good: Named exports (preferred)
export function Button() { }
export const API_URL = '...';

// ✅ Acceptable: Default export for pages/components
export default function HomePage() { }
```

## Error Handling

### Try-Catch

```typescript
// ✅ Good: Specific error handling
try {
  const user = await fetchUser(id);
  return user;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new BadRequestError(error.message);
  }
  throw new ServerError('Failed to fetch user');
}
```

### API Responses

```typescript
// ✅ Good: Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## Validation

### Zod Schemas

```typescript
// ✅ Good: Define schemas for validation
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['super_admin', 'manager', 'staff']),
});

type User = z.infer<typeof UserSchema>;
```

## Comments

### When to Comment

```typescript
// ✅ Good: Explain WHY, not WHAT
// Calculate discount based on customer loyalty tier
// Tier 1: 5%, Tier 2: 10%, Tier 3: 15%
function calculateDiscount(tier: number): number {
  return tier * 5;
}

// ❌ Bad: Obvious comments
// This function adds two numbers
function add(a: number, b: number): number {
  return a + b;
}
```

### JSDoc for Complex Functions

```typescript
/**
 * Calculates the total price including taxes and discounts
 * @param items - Array of items in the cart
 * @param taxRate - Tax rate as a decimal (e.g., 0.18 for 18%)
 * @param discountCode - Optional discount code
 * @returns Total price after taxes and discounts
 */
function calculateTotal(
  items: Item[],
  taxRate: number,
  discountCode?: string
): number {
  // Implementation
}
```

## Async/Await

```typescript
// ✅ Good: Use async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ❌ Bad: Promise chains
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Failed to fetch data:', error);
      throw error;
    });
}
```

## Database Operations

### Mongoose Models

```typescript
// ✅ Good: Type-safe model definition
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  password: string;
  role: 'super_admin' | 'manager' | 'staff';
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'manager', 'staff'], required: true },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
```

## Testing

### Test File Naming

```typescript
// Component tests
Button.test.tsx
UserProfile.test.tsx

// Service tests
Auth.service.test.ts
Booking.service.test.ts
```

### Test Structure

```typescript
describe('Button Component', () => {
  it('should render with correct label', () => {
    // Arrange
    const label = 'Click me';
    
    // Act
    render(<Button label={label} onClick={() => {}} />);
    
    // Assert
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
```

## Performance

### Memoization

```typescript
// ✅ Good: Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Code Splitting

```typescript
// ✅ Good: Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Spinner />,
});
```

## Security

### Input Sanitization

```typescript
// ✅ Good: Validate and sanitize inputs
const sanitizedInput = z.string().trim().min(1).max(100).parse(userInput);
```

### Environment Variables

```typescript
// ✅ Good: Validate environment variables
const env = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
}).parse(process.env);
```

## Accessibility

```typescript
// ✅ Good: Proper ARIA labels
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <CloseIcon />
</button>

// ✅ Good: Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

## Git Commit Messages

```
✅ Good:
feat: Add user authentication with JWT
fix: Resolve booking date validation issue
docs: Update API documentation
refactor: Simplify booking service logic
test: Add unit tests for invoice generation

❌ Bad:
Update code
Fix bug
Changes
```

## Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] All functions have proper type annotations
- [ ] Error handling is implemented
- [ ] Input validation is present
- [ ] Code is properly formatted (Prettier)
- [ ] No console.logs in production code
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
