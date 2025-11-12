# 🚀 Quick Start Guide - Ruzizi Hôtel Platform

## Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies
```bash
cd ruzizi-hotel-platform
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/ruzizi-hotel
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or if using MongoDB service
sudo service mongod start
```

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 🎯 First Steps

### 1. Create Super Admin Account
Navigate to: `http://localhost:3000/auth/register`

Create your first super admin account with:
- Email
- Password
- Role: super_admin

### 2. Login
Navigate to: `http://localhost:3000/auth/login`

Login with your super admin credentials.

### 3. Create Your First Establishment
1. Go to BackOffice Dashboard
2. Navigate to "Establishments"
3. Click "New Establishment"
4. Fill in the details:
   - Name
   - Location (city, country, address)
   - Pricing mode (nightly/monthly/hourly)
   - Services offered
   - Contact information

### 4. Add Accommodations
1. Navigate to "Accommodations"
2. Click "New Accommodation"
3. Fill in details:
   - Name
   - Type (standard room, suite, house, apartment)
   - Capacity (guests, bedrooms, bathrooms)
   - Pricing
   - Amenities
   - Images

### 5. Start Taking Bookings!
Your system is now ready to accept bookings through:
- **FrontOffice**: Public booking wizard
- **BackOffice**: Manual booking creation
- **Walk-in**: Same-day hourly bookings

---

## 📱 Access Points

### FrontOffice (Public)
- **Homepage**: `http://localhost:3000`
- **Establishments**: `http://localhost:3000/establishments`
- **Booking**: `http://localhost:3000/booking`
- **Track Booking**: `http://localhost:3000/track-booking`

### BackOffice (Admin)
- **Dashboard**: `http://localhost:3000/dashboard`
- **Establishments**: `http://localhost:3000/establishments`
- **Accommodations**: `http://localhost:3000/accommodations`
- **Bookings**: `http://localhost:3000/bookings`
- **Walk-in**: `http://localhost:3000/bookings/walkin`
- **Invoices**: `http://localhost:3000/invoices`
- **Clients**: `http://localhost:3000/clients`
- **Expenses**: `http://localhost:3000/expenses`
- **Analytics**: `http://localhost:3000/analytics`

---

## 🔑 User Roles

### Super Admin
- Full access to all features
- Can manage all establishments
- Can create managers and staff
- Access to all analytics

### Manager
- Access limited to assigned establishment
- Can manage bookings, invoices, expenses
- Can view analytics for their establishment
- Cannot create other managers

### Staff
- Limited access based on permissions
- Can create bookings
- Can view client information
- Cannot access financial data

---

## 💡 Common Tasks

### Create a Booking
1. Go to Bookings → New Booking
2. Select establishment and accommodation
3. Choose dates and number of guests
4. Enter client information
5. Confirm booking

### Create Walk-in Booking
1. Go to Bookings → Walk-in
2. Select establishment and accommodation
3. Choose date and time slots
4. Enter client information
5. System charges full daily rate
6. Multiple bookings allowed same day

### Generate Invoice
1. Go to Invoices → New Invoice
2. Select booking (optional)
3. Add items and amounts
4. Apply discounts/taxes if needed
5. Generate invoice

### Record Payment
1. Go to Invoices
2. Select invoice
3. Click "Add Payment"
4. Enter amount and payment method
5. Submit payment

### Track Expenses
1. Go to Expenses → New Expense
2. Select category
3. Enter amount and description
4. Upload attachments if needed
5. Submit for approval

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo service mongod status

# Start MongoDB
sudo service mongod start
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📚 Additional Resources

- **Full Documentation**: See `IMPLEMENTATION_SUMMARY.md`
- **API Documentation**: See `app/api/` directory
- **Database Schema**: See `models/` directory
- **Business Logic**: See `services/` directory

---

## ✅ System Health Check

Run these checks to ensure everything is working:

1. ✅ MongoDB connected
2. ✅ Server running on port 3000
3. ✅ Can access homepage
4. ✅ Can login to BackOffice
5. ✅ Can create establishment
6. ✅ Can create accommodation
7. ✅ Can create booking
8. ✅ Can generate invoice

---

## 🎉 You're Ready!

Your Ruzizi Hôtel Platform is now fully operational. Start managing your hotel business with confidence!

For questions or issues, refer to the implementation documentation or check the code comments in the source files.

**Happy Hotel Managing! 🏨**
