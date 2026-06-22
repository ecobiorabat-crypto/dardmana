/**
 * Initialise le contenu CMS éditable (idempotent) :
 *   - Singleton HomepageSettings (bandeau d'annonce activé par défaut)
 *   - Page CMS "notre-histoire" (brouillon : la version riche intégrée reste
 *     affichée tant que l'admin ne publie pas)
 *   - Page CMS "contact-info" (brouillon)
 *
 * Les pages sont créées en BROUILLON pour ne pas remplacer le contenu actuel ;
 * l'admin les édite puis les publie quand il le souhaite.
 *
 * Usage : npm run seed-cms
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const notreHistoire = {
  slug: 'notre-histoire',
  titleFr: 'Notre Histoire',
  titleAr: 'قصتنا',
  titleEn: 'Our Story',
  contentFr: `## Une passion née au cœur du Maroc

Dar Dmana est née d'une conviction simple : l'artisanat marocain mérite une place parmi les plus grandes maisons de luxe. Dans les médinas de Fès, Marrakech et Casablanca, des mains expertes perpétuent depuis des siècles des gestes d'une précision rare.

Nous avons choisi de réunir ces maîtres artisans pour créer des pièces qui traversent le temps — alliant l'authenticité du patrimoine à l'exigence du raffinement contemporain.

## Nos valeurs

- **Authenticité** — chaque création honore un savoir-faire ancestral.
- **Excellence** — des matériaux nobles et une finition irréprochable.
- **Transparence** — une chaîne de valeur équitable, du maître artisan à votre porte.`,
  contentAr: `## شغفٌ وُلِد في قلب المغرب

وُلدت دار ضمانة من قناعة بسيطة: الحرفية المغربية تستحق مكانة بين أعرق دور الفخامة. في مدن فاس ومراكش والدار البيضاء، تُديم أيادٍ ماهرة منذ قرون حِرَفًا ذات دقة نادرة.

اخترنا أن نجمع هؤلاء الحرفيين المهرة لإبداع قطع تتحدى الزمن — تجمع بين أصالة التراث ومتطلبات الرقيّ المعاصر.

## قيمنا

- **الأصالة** — كل قطعة تُكرّم مهارة عريقة.
- **التميّز** — مواد نبيلة وتشطيب لا تشوبه شائبة.
- **الشفافية** — سلسلة قيمة عادلة من الحرفي إلى بابك.`,
  contentEn: `## A passion born in the heart of Morocco

Dar Dmana was born from a simple conviction: Moroccan craftsmanship deserves a place among the greatest luxury houses. In the medinas of Fez, Marrakech and Casablanca, expert hands have perpetuated gestures of rare precision for centuries.

We chose to bring together these master artisans to create timeless pieces — blending the authenticity of heritage with the demands of contemporary refinement.

## Our values

- **Authenticity** — every creation honours an ancestral craft.
- **Excellence** — noble materials and impeccable finishing.
- **Transparency** — a fair value chain, from the artisan to your door.`,
}

const contactInfo = {
  slug: 'contact-info',
  titleFr: 'Nos coordonnées',
  titleAr: 'بيانات التواصل',
  titleEn: 'Our details',
  contentFr: `Retrouvez-nous ou contactez-nous directement.

**Horaires** : Lun – Sam : 9h – 19h

Notre équipe vous répond sous 24h ouvrées.`,
  contentAr: `تجدنا أو تواصل معنا مباشرة.

**أوقات العمل**: الإثنين – السبت: 9ص – 7م

يجيبك فريقنا خلال 24 ساعة عمل.`,
  contentEn: `Find us or reach out directly.

**Hours**: Mon – Sat: 9am – 7pm

Our team replies within 24 business hours.`,
}

async function seedPage(page: typeof notreHistoire) {
  const existing = await prisma.cMSPage.findUnique({ where: { slug: page.slug }, select: { slug: true } })
  if (existing) {
    console.log(`• Page "${page.slug}" déjà présente — inchangée.`)
    return
  }
  await prisma.cMSPage.create({ data: { ...page, isPublished: false } })
  console.log(`✓ Page "${page.slug}" créée (brouillon).`)
}

async function main() {
  // HomepageSettings (singleton) : bandeau d'annonce activé par défaut.
  const homepage = await prisma.homepageSettings.findUnique({ where: { id: 'singleton' }, select: { id: true } })
  if (homepage) {
    console.log('• HomepageSettings déjà présent — inchangé.')
  } else {
    await prisma.homepageSettings.create({ data: { id: 'singleton', announcementActive: true } })
    console.log('✓ HomepageSettings créé (bandeau d\'annonce activé).')
  }

  await seedPage(notreHistoire)
  await seedPage(contactInfo)

  console.log('\n──────── Seed CMS terminé ────────')
}

main()
  .catch((e) => { console.error('❌ Erreur:', e.message); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
