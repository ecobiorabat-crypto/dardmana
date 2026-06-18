/**
 * Vérifications explicites de la matrice PERMISSIONS (lib/auth/permissions.ts).
 * Exécution : npm run test:permissions
 */
import { strict as assert } from 'node:assert'
import { hasPermission, PERMISSIONS } from './permissions'

// ─── CAS 1 : MANAGER — lecture commandes OK, écriture catalogue refusée ───────
// PERMISSIONS['products.create'] = ['SUPER_ADMIN', 'ADMIN'] — MANAGER absent
assert.equal(
  hasPermission('MANAGER', 'products.create'),
  false,
  'MANAGER ne doit pas pouvoir créer des produits',
)
assert.equal(
  hasPermission('MANAGER', 'products.update'),
  false,
  'MANAGER ne doit pas pouvoir modifier des produits',
)
assert.equal(
  hasPermission('MANAGER', 'orders.view'),
  true,
  'MANAGER peut consulter les commandes',
)

// ─── CAS 2 : STOCK — produits OK, clients interdits ───────────────────────────
// PERMISSIONS['customers.view'] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT']
assert.equal(
  hasPermission('STOCK', 'customers.view'),
  false,
  'STOCK ne doit pas accéder aux pages clients',
)
assert.equal(
  hasPermission('STOCK', 'products.view'),
  true,
  'STOCK peut consulter le catalogue',
)
assert.equal(
  hasPermission('STOCK', 'products.update'),
  true,
  'STOCK peut ajuster le stock (products.update)',
)

// ─── Cohérence map : chaque permission listée a au moins un rôle ─────────────
for (const [permission, roles] of Object.entries(PERMISSIONS)) {
  assert.ok(roles.length > 0, `${permission} doit avoir au moins un rôle autorisé`)
}

console.log('✓ permissions.test.ts — 2 cas métier + cohérence map OK')
