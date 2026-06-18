/**
 * Crée ou met à jour un AdminUser en base.
 * Usage : npm run create-admin <email> <password> <nom>
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as readline from 'node:readline'
import { config } from 'dotenv'

config({ path: '.env.local' })

// ─── Args ─────────────────────────────────────────────────────────────────────

const [, , email, password, ...nameParts] = process.argv
const name = nameParts.join(' ')

if (!email || !password || !name) {
  console.error('\nUsage: npm run create-admin <email> <password> <nom>\n')
  process.exit(1)
}

if (!email.includes('@')) {
  console.error('Email invalide.')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Le mot de passe doit faire au moins 8 caractères.')
  process.exit(1)
}

// ─── Prisma ───────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Prompt de confirmation ───────────────────────────────────────────────────

function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'o' || answer.trim().toLowerCase() === 'y')
    })
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const existing = await prisma.adminUser.findUnique({ where: { email } })

  if (existing) {
    console.log(`\n⚠  Un AdminUser avec l'email ${email} existe déjà.`)
    console.log(`   Nom actuel : ${existing.name}  |  Rôle : ${existing.role}`)
    const ok = await confirm('   Écraser cet utilisateur ? [o/N] : ')
    if (!ok) {
      console.log('Annulé.\n')
      await prisma.$disconnect()
      await pool.end()
      process.exit(0)
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.adminUser.upsert({
    where:  { email },
    create: { email, name, passwordHash, role: 'SUPER_ADMIN' },
    update: { name, passwordHash, role: 'SUPER_ADMIN', isActive: true },
  })

  console.log('\n✓ AdminUser créé avec succès\n')
  console.log(`  ID       : ${user.id}`)
  console.log(`  Email    : ${user.email}`)
  console.log(`  Nom      : ${user.name}`)
  console.log(`  Rôle     : ${user.role}`)
  console.log(`  Actif    : ${user.isActive}`)
  console.log(`  Créé le  : ${user.createdAt.toLocaleString('fr-FR')}\n`)
}

main()
  .catch((err) => {
    console.error('\n✗ Erreur :', err.message ?? err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
