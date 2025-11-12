# Project Structure - Ruzizi Hôtel Platform

## Directory Organization

### `/app` - Next.js App Router
Application routes and pages using Next.js 14+ App Router.

#### `/(frontoffice)` - Public Pages
- `page.tsx` - Homepage
- `establishments/` - Hotel establishments listing and details
- `accommodations/` - Rooms and suites details
- `booking/` - Booking flow
- `track-booking/` - Booking tracking by code

#### `/(backoffice)` - Admin Panel
- `dashboard/` - Main dashboard
- `establishments/` - Establishment management
- `accommodations/` - Room management
- `bookings/` - Booking management
- `clients/` - Client management
- `invoices/` - Invoice & payments
- `expenses/` - Expense tracking
- `hr/` - HR module
  - `employees/` - Employee management
  - `attendance/` - Time tracking
  - `payroll/` - Payroll management
  - `leaves/` - Leave management
- `analytics/` - Reports & analytics
- `settings/` - System settings

#### `/api` - API Routes
RESTful API endpoints for data operations.

#### `/auth` - Authentication Pages
Login, logout, and authentication-related pages.

### `/components` - Reusable Components

#### `/ui` - Base UI Components
Reusable UI components (buttons, inputs, cards, modals, etc.)

#### `/frontoffice` - FrontOffice Components
Components specific to public pages (hero, testimonials, etc.)

#### `/backoffice` - BackOffice Components
Components specific to admin panel (tables, forms, dashboards, etc.)

### `/lib` - Utilities & Configurations

#### `/db` - Database Connection
MongoDB connection utilities and configuration.

#### `/auth` - Authentication Utilities
JWT utilities, password hashing, token management.

#### `/utils` - Helper Functions
General utility functions and helpers.

#### `/constants` - Constants & Enums
Application constants, enumerations, and configuration values.

### `/models` - Mongoose Models
Database models and schemas:
- User
- Establishment
- Accommodation
- Booking
- Invoice
- Expense
- Employee
- Attendance
- Shift
- Payroll
- Leave
- Client

### `/services` - Business Logic Services
Service layer containing business logic:
- AuthService
- EstablishmentService
- AccommodationService
- BookingService
- InvoiceService
- ExpenseService
- EmployeeService
- AttendanceService
- PayrollService
- LeaveService
- AnalyticsService

### `/types` - TypeScript Types
Type definitions and interfaces for the application.

### `/public` - Static Assets
Static files (images, fonts, icons, etc.)

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `User.types.ts`)
- **Services**: PascalCase with `.service.ts` suffix (e.g., `Auth.service.ts`)
- **Models**: PascalCase with `.model.ts` suffix (e.g., `User.model.ts`)

## Import Aliases

The project uses `@/*` as an import alias pointing to the root directory:

```typescript
import { Button } from '@/components/ui/Button';
import { connectDB } from '@/lib/db/connection';
import { UserModel } from '@/models/User.model';
```

## Environment Variables

All environment variables are defined in `.env.example` and should be copied to `.env.local` for local development.

## Code Organization Best Practices

1. **Separation of Concerns**: Keep business logic in services, not in components
2. **Reusability**: Create reusable components in `/components/ui`
3. **Type Safety**: Define types in `/types` and use them throughout
4. **Validation**: Use Zod schemas for data validation
5. **Error Handling**: Implement consistent error handling across the app
6. **Testing**: Co-locate tests with their respective files (e.g., `Button.test.tsx`)

## Module Dependencies

```
Components → Services → Models → Database
     ↓          ↓
   Types    Utilities
```

- Components should only import from services, types, and utilities
- Services contain business logic and interact with models
- Models define database schemas and interact with MongoDB
- Utilities are pure functions with no side effects
