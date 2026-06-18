import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Prisma CLI ne charge pas .env.local automatiquement (convention Next.js)
config({ path: '.env.local' })

export default defineConfig({
  migrations: {
    seed: 'ts-node --project tsconfig.seed.json prisma/seed.ts',
  },
  datasource: {
    // Session pooler (port 5432) pour migrate/seed – contourne PgBouncer tx mode
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
