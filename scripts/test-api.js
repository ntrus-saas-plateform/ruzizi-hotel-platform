const BASE_URL = 'http://localhost:3000';
let token = null;
let results = { successes: 0, failures: 0, details: [] };

async function login() {
  console.log('Logging in...');
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ntrus07@outlook.fr', password: 'Test1234' })
  });
  if (res.ok) {
    const data = await res.json();
    token = data.data.tokens.accessToken;
    console.log('Login successful');
    results.successes++;
    results.details.push({ endpoint: '/api/auth/login', method: 'POST', status: 'success' });
  } else {
    console.log('Login failed');
    results.failures++;
    results.details.push({ endpoint: '/api/auth/login', method: 'POST', status: 'failure', code: res.status });
  }
}

async function testEndpoint(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const success = res.status >= 200 && res.status < 300;
    if (success) {
      results.successes++;
    } else {
      results.failures++;
    }
    results.details.push({ endpoint: path, method, status: success ? 'success' : 'failure', code: res.status });
    console.log(`${method} ${path}: ${success ? 'SUCCESS' : 'FAILURE'} (${res.status})`);
  } catch (error) {
    results.failures++;
    results.details.push({ endpoint: path, method, status: 'error', error: error.message });
    console.log(`${method} ${path}: ERROR - ${error.message}`);
  }
}

async function runTests() {
  // Auth endpoints
  await testEndpoint('POST', '/api/auth/login', { email: 'ntrus07@outlook.fr', password: 'M5TNuT' }, false);
  await testEndpoint('POST', '/api/auth/register', {
    email: 'testuser@example.com',
    password: 'Test1234',
    role: 'staff',
    establishmentId: null,
    profile: { firstName: 'Test', lastName: 'User', phone: '12345678' }
  }, false);
  await testEndpoint('POST', '/api/auth/forgot-password', { email: 'test@example.com' }, false);

  // Login to get token
  await login();

  if (!token) {
    console.log('Cannot proceed without token');
    return;
  }

  // Me
  await testEndpoint('GET', '/api/auth/me');

  // Users
  await testEndpoint('GET', '/api/users');
  await testEndpoint('POST', '/api/users', {
    email: 'manager@example.com',
    password: 'Test1234',
    role: 'manager',
    establishmentId: null,
    profile: { firstName: 'Manager', lastName: 'Test', phone: '12345678' }
  });

  // Establishments
  await testEndpoint('GET', '/api/establishments');
  await testEndpoint('POST', '/api/establishments', {
    name: 'Test Hotel',
    description: 'A test hotel for API testing',
    location: {
      city: 'Bujumbura',
      address: '123 Test Street',
      coordinates: { lat: -3.3614, lng: 29.3599 }
    },
    pricingMode: 'nightly',
    contacts: {
      phone: ['12345678'],
      email: 'test@hotel.com'
    },
    services: ['wifi', 'parking'],
    images: [],
    managerId: '691c8f0aee691d3cd35a9ffa', // root user ID
    staffIds: [],
    totalCapacity: 50,
    isActive: true
  });

  // Accommodations
  await testEndpoint('GET', '/api/accommodations');
  // For POST, need establishmentId, assume one exists or use dummy
  await testEndpoint('POST', '/api/accommodations', {
    establishmentId: 'dummy_establishment_id',
    name: 'Test Room',
    type: 'standard_room',
    pricingMode: 'nightly',
    pricing: { basePrice: 50000, currency: 'BIF' },
    capacity: { maxGuests: 2, bedrooms: 1, bathrooms: 1, showers: 1, livingRooms: 0, kitchens: 0, balconies: 0 },
    amenities: ['wifi'],
    status: 'available',
    images: []
  });

  // Bookings
  await testEndpoint('GET', '/api/bookings');
  await testEndpoint('POST', '/api/bookings', {
    establishmentId: 'dummy_establishment_id',
    accommodationId: 'dummy_accommodation_id',
    clientInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '12345678'
    },
    bookingType: 'online',
    checkIn: '2025-12-01',
    checkOut: '2025-12-02',
    numberOfGuests: 2
  });

  // Payroll
  await testEndpoint('GET', '/api/payroll');
  await testEndpoint('POST', '/api/payroll', {
    employeeId: 'dummy_employee_id',
    period: { month: 11, year: 2025 },
    baseSalary: 300000,
    allowances: [],
    deductions: [],
    bonuses: [],
    notes: 'Test payroll'
  });

  // Leave
  await testEndpoint('GET', '/api/leave');
  await testEndpoint('POST', '/api/leave', {
    employeeId: 'dummy_employee_id',
    type: 'annual',
    startDate: '2025-12-01',
    endDate: '2025-12-05',
    reason: 'Test leave'
  });

  // Maintenance
  await testEndpoint('GET', '/api/maintenance');
  await testEndpoint('POST', '/api/maintenance', {
    accommodationId: 'dummy_accommodation_id',
    type: 'repair',
    description: 'Test maintenance',
    priority: 'medium',
    estimatedCost: 10000
  });

  // Public endpoints
  await testEndpoint('GET', '/api/public/accommodations', null, false);
  await testEndpoint('GET', '/api/public/establishments', null, false);
  await testEndpoint('GET', '/api/public/bookings', null, false);

  // Reports
  await testEndpoint('GET', '/api/reports/financial');
  await testEndpoint('GET', '/api/reports/hr');
  await testEndpoint('GET', '/api/reports/comparison');

  // Invoices
  await testEndpoint('GET', '/api/invoices');

  // Expenses
  await testEndpoint('GET', '/api/expenses');
  await testEndpoint('POST', '/api/expenses', {
    establishmentId: 'dummy_establishment_id',
    category: 'maintenance',
    amount: 50000,
    description: 'Test expense',
    date: '2025-11-18'
  });

  // Attendance
  await testEndpoint('GET', '/api/attendance');
  await testEndpoint('POST', '/api/attendance/checkin', { employeeId: 'dummy_employee_id' });

  // Notifications
  await testEndpoint('GET', '/api/notifications');

  // Performance
  await testEndpoint('GET', '/api/performance');

  // Audit
  await testEndpoint('GET', '/api/audit');

  // Backup
  await testEndpoint('GET', '/api/backup/list');

  // Init
  await testEndpoint('POST', '/api/init', {}, false);

  // Alerts
  await testEndpoint('GET', '/api/alerts/check');

  console.log('\n=== Test Summary ===');
  console.log(`Successes: ${results.successes}`);
  console.log(`Failures: ${results.failures}`);
  console.log('\nDetails:');
  results.details.forEach(d => {
    console.log(`${d.method} ${d.endpoint}: ${d.status} ${d.code ? `(${d.code})` : ''} ${d.error ? `Error: ${d.error}` : ''}`);
  });
}

runTests().catch(console.error);