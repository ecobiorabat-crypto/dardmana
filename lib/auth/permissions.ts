export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'SUPPORT'
  | 'STOCK'
  | 'FINANCE'

export type Permission =
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'products.view'
  | 'orders.view'
  | 'orders.update'
  | 'orders.cancel'
  | 'orders.export'
  | 'customers.view'
  | 'customers.update'
  | 'coupons.create'
  | 'coupons.update'
  | 'coupons.delete'
  | 'analytics.view'
  | 'payments.view'
  | 'payments.refund'
  | 'cms.update'
  | 'admin.users'
  | 'operations.view'
  | 'operations.retry'

const ALL_PERMISSIONS: Permission[] = [
  'products.create', 'products.update', 'products.delete', 'products.view',
  'orders.view', 'orders.update', 'orders.cancel', 'orders.export',
  'customers.view', 'customers.update',
  'coupons.create', 'coupons.update', 'coupons.delete',
  'analytics.view',
  'payments.view', 'payments.refund',
  'cms.update',
  'admin.users',
  'operations.view', 'operations.retry',
]

export const PERMISSIONS: Record<Permission, AdminRole[]> = {
  // Products
  'products.view':   ['SUPER_ADMIN', 'ADMIN', 'STOCK'],
  'products.create': ['SUPER_ADMIN', 'ADMIN'],
  'products.update': ['SUPER_ADMIN', 'ADMIN', 'STOCK'],
  'products.delete': ['SUPER_ADMIN', 'ADMIN'],

  // Orders
  'orders.view':   ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'STOCK', 'FINANCE'],
  'orders.update': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  'orders.cancel': ['SUPER_ADMIN', 'ADMIN'],
  'orders.export': ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],

  // Customers
  'customers.view':   ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT'],
  'customers.update': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

  // Coupons
  'coupons.create': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  'coupons.update': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  'coupons.delete': ['SUPER_ADMIN', 'ADMIN'],

  // Analytics
  'analytics.view': ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],

  // Payments
  'payments.view':   ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],
  'payments.refund': ['SUPER_ADMIN', 'ADMIN'],

  // CMS
  'cms.update': ['SUPER_ADMIN', 'ADMIN'],

  // Admin user management
  'admin.users': ['SUPER_ADMIN'],

  // Operations
  'operations.view':  ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK'],
  'operations.retry': ['SUPER_ADMIN', 'ADMIN'],
}

export function hasPermission(role: AdminRole, action: Permission): boolean {
  if (role === 'SUPER_ADMIN') return true
  return PERMISSIONS[action]?.includes(role) ?? false
}

export function getPermissionsForRole(role: AdminRole): Permission[] {
  if (role === 'SUPER_ADMIN') return ALL_PERMISSIONS
  return ALL_PERMISSIONS.filter((p) => PERMISSIONS[p]?.includes(role))
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  SUPPORT: 'Support Client',
  STOCK: 'Gestionnaire Stock',
  FINANCE: 'Comptabilité',
}
