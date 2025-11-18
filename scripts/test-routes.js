const routes = [
  '/',
  '/establishments',
  '/establishments/1',
  '/login',
  '/backoffice/login',
  '/admin/dashboard',
  '/admin/accommodations',
  '/admin/accommodations/1',
  '/admin/accommodations/1/edit',
  '/admin/accommodations/create',
  '/admin/analytics',
  '/admin/audit',
  '/admin/bookings',
  '/admin/bookings/1',
  '/admin/bookings/1/edit',
  '/admin/bookings/create',
  '/admin/bookings/pending',
  '/admin/bookings/walkin',
  '/admin/clients',
  '/admin/clients/1',
  '/admin/clients/1/edit',
  '/admin/dashboard',
  '/admin/establishments',
  '/admin/establishments/1',
  '/admin/establishments/1/edit',
  '/admin/establishments/create',
  '/admin/expenses',
  '/admin/expenses/1',
  '/admin/expenses/1/edit',
  '/admin/expenses/create',
  '/admin/hr/analytics',
  '/admin/hr/attendance',
  '/admin/hr/employees',
  '/admin/hr/leave',
  '/admin/hr/payroll',
  '/admin/invoices',
  '/admin/invoices/1',
  '/admin/invoices/create',
  '/admin/maintenance',
  '/admin/profile',
  '/admin/reports',
  '/admin/settings',
  '/admin/system/backups',
  '/admin/users',
  '/admin/users/1',
  '/admin/users/1/edit',
  '/admin/users/create',
  '/auth/login'
];

async function testRoute(url) {
  try {
    const response = await fetch(url);
    if (response.status === 200) {
      return { url, success: true, status: response.status };
    } else {
      return { url, success: false, status: response.status };
    }
  } catch (error) {
    return { url, success: false, error: error.message };
  }
}

async function main() {
  const baseUrl = 'http://localhost:3000';
  const results = [];
  for (const route of routes) {
    const url = baseUrl + route;
    const result = await testRoute(url);
    results.push(result);
  }
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    failures.forEach(f => );
  }
}

main();