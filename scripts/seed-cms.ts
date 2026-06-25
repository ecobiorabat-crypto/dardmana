/**
 * Initialise le contenu CMS éditable (idempotent) :
 *   - Singleton HomepageSettings (bandeau d'annonce activé par défaut)
 *   - Page CMS "notre-histoire" (brouillon)
 *   - Page CMS "contact-info" (brouillon)
 *   - Page CMS "faq" (brouillon ; markdown généré depuis les traductions)
 *   - Page CMS "livraison-retours" (brouillon ; idem)
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
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Génération du markdown depuis les traductions (cohérence avec le hardcode) ──

type Messages = {
  Faq: { categories: { name: string; items: { q: string; a: string }[] }[] }
  Shipping: {
    delaysTitle: string
    rows: { zone: string; time: string; price: string }[]
    returnsTitle: string
    returnDelayLabel: string; returnDelay: string
    returnConditionsLabel: string; returnConditions: string
    returnHowLabel: string; returnHow: string
    returnRefundLabel: string; returnRefund: string
    faqTitle: string
    faq: { q: string; a: string }[]
  }
}

function loadMessages(locale: string): Messages {
  return JSON.parse(readFileSync(resolve(process.cwd(), `messages/${locale}.json`), 'utf8')) as Messages
}

function faqMarkdown(m: Messages): string {
  return m.Faq.categories
    .map((c) => `## ${c.name}\n\n` + c.items.map((it) => `### ${it.q}\n\n${it.a}`).join('\n\n'))
    .join('\n\n')
}

function shippingMarkdown(m: Messages): string {
  const s = m.Shipping
  const delays = `## ${s.delaysTitle}\n\n` + s.rows.map((r) => `- **${r.zone}** : ${r.time} — ${r.price}`).join('\n')
  const returns =
    `## ${s.returnsTitle}\n\n` +
    `- **${s.returnDelayLabel}** : ${s.returnDelay}\n` +
    `- **${s.returnConditionsLabel}** : ${s.returnConditions}\n` +
    `- **${s.returnHowLabel}** : ${s.returnHow}\n` +
    `- **${s.returnRefundLabel}** : ${s.returnRefund}`
  const faq = `## ${s.faqTitle}\n\n` + s.faq.map((q) => `### ${q.q}\n\n${q.a}`).join('\n\n')
  return [delays, returns, faq].join('\n\n')
}

const FR = loadMessages('fr')
const AR = loadMessages('ar')
const EN = loadMessages('en')

const faqPage = {
  slug: 'faq',
  titleFr: 'Questions Fréquentes',
  titleAr: 'الأسئلة الشائعة',
  titleEn: 'Frequently Asked Questions',
  contentFr: faqMarkdown(FR),
  contentAr: faqMarkdown(AR),
  contentEn: faqMarkdown(EN),
}

const livraisonRetours = {
  slug: 'livraison-retours',
  titleFr: 'Livraison & Retours',
  titleAr: 'التوصيل والإرجاع',
  titleEn: 'Shipping & Returns',
  contentFr: shippingMarkdown(FR),
  contentAr: shippingMarkdown(AR),
  contentEn: shippingMarkdown(EN),
}

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

// ─── Pages légales (publiées immédiatement) ──────────────────────────────────

const mentionsLegales = {
  slug: 'mentions-legales',
  titleFr: 'Mentions Légales',
  titleAr: 'الإشعارات القانونية',
  titleEn: 'Legal Notice',
  contentFr: `## Éditeur du site

Dar Dmana — Artisanat Marocain Authentique
Site web : https://dardmana.ma
Email : contact@dardmana.ma

## Hébergement

Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA

## Propriété intellectuelle

L'ensemble du contenu de ce site (textes, images, logos, vidéos) est la propriété exclusive de Dar Dmana et est protégé par les lois marocaines et internationales sur la propriété intellectuelle. Toute reproduction sans autorisation est interdite.

## Responsabilité

Dar Dmana s'efforce d'assurer l'exactitude des informations publiées. Nous nous réservons le droit de modifier le contenu à tout moment.`,
  contentAr: `## ناشر الموقع

دار ضمانة — صناعة تقليدية مغربية أصيلة
الموقع الإلكتروني: https://dardmana.ma
البريد الإلكتروني: contact@dardmana.ma

## الاستضافة

Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA

## الملكية الفكرية

جميع محتويات هذا الموقع (النصوص، الصور، الشعارات، مقاطع الفيديو) هي ملكية حصرية لدار ضمانة ومحمية بموجب القوانين المغربية والدولية للملكية الفكرية. يُمنع أي نسخ دون إذن.

## المسؤولية

تسعى دار ضمانة لضمان دقة المعلومات المنشورة. نحتفظ بالحق في تعديل المحتوى في أي وقت.`,
  contentEn: `## Site Publisher

Dar Dmana — Authentic Moroccan Craftsmanship
Website: https://dardmana.ma
Email: contact@dardmana.ma

## Hosting

Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA

## Intellectual Property

All content on this site (text, images, logos, videos) is the exclusive property of Dar Dmana and is protected by Moroccan and international intellectual property laws. Any reproduction without authorization is prohibited.

## Liability

Dar Dmana strives to ensure the accuracy of the information published. We reserve the right to modify the content at any time.`,
}

const confidentialite = {
  slug: 'confidentialite',
  titleFr: 'Politique de Confidentialité',
  titleAr: 'سياسة الخصوصية',
  titleEn: 'Privacy Policy',
  contentFr: `## Données collectées

Lors de vos achats, nous collectons : nom, prénom, adresse email, numéro de téléphone, adresse de livraison, historique de commandes.

## Utilisation des données

Vos données sont utilisées uniquement pour :

- Traiter et livrer vos commandes
- Vous envoyer des confirmations de commande
- Améliorer notre service client

Nous ne vendons ni ne partageons vos données avec des tiers à des fins commerciales.

## Vos droits

Conformément à la loi 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
Contact : contact@dardmana.ma

## Cookies

Ce site utilise des cookies techniques nécessaires au fonctionnement du site et des cookies analytics pour améliorer votre expérience.`,
  contentAr: `## البيانات المجمَّعة

عند إجراء مشترياتك، نقوم بجمع: الاسم، النسب، البريد الإلكتروني، رقم الهاتف، عنوان التسليم، سجل الطلبات.

## استخدام البيانات

تُستخدم بياناتك فقط من أجل:

- معالجة طلباتك وتسليمها
- إرسال تأكيدات الطلب إليك
- تحسين خدمة العملاء لدينا

نحن لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة لأغراض تجارية.

## حقوقك

وفقًا للقانون 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، لديك الحق في الوصول إلى بياناتك وتصحيحها وحذفها.
للتواصل: contact@dardmana.ma

## ملفات تعريف الارتباط

يستخدم هذا الموقع ملفات تعريف ارتباط تقنية ضرورية لعمل الموقع وملفات تحليلية لتحسين تجربتك.`,
  contentEn: `## Data Collected

When you make purchases, we collect: first name, last name, email address, phone number, delivery address, order history.

## Use of Data

Your data is used solely to:

- Process and deliver your orders
- Send you order confirmations
- Improve our customer service

We do not sell or share your data with third parties for commercial purposes.

## Your Rights

In accordance with Law 09-08 on the protection of individuals with regard to the processing of personal data, you have the right to access, rectify and delete your data.
Contact: contact@dardmana.ma

## Cookies

This site uses technical cookies necessary for the site to function and analytics cookies to improve your experience.`,
}

const cgv = {
  slug: 'cgv',
  titleFr: 'Conditions Générales de Vente',
  titleAr: 'الشروط العامة للبيع',
  titleEn: 'Terms and Conditions',
  contentFr: `## Article 1 — Objet

Les présentes CGV régissent les ventes effectuées sur le site dardmana.ma par Dar Dmana.

## Article 2 — Produits

Nos produits sont des créations artisanales marocaines. Les photos sont représentatives mais de légères variations naturelles peuvent exister (bois naturel, pierres semi-précieuses).

## Article 3 — Prix

Les prix sont indiqués en MAD (Dirham Marocain) et en EUR pour les commandes internationales, toutes taxes comprises. Dar Dmana se réserve le droit de modifier ses prix à tout moment.

## Article 4 — Commandes

Toute commande vaut acceptation des présentes CGV. La confirmation de commande vous sera envoyée par email dans les 24 heures.

## Article 5 — Paiement

- Maroc : paiement à la livraison (COD) ou en ligne
- International : paiement en ligne sécurisé (Stripe)

Vos données bancaires sont cryptées et sécurisées.

## Article 6 — Livraison

- Maroc : 24-48h (standard) ou 24h (express)
- Europe : 7-10 jours ouvrés
- International : 10-20 jours ouvrés

Les délais courent à partir de la confirmation de commande.

## Article 7 — Retours

Vous disposez de 7 jours à compter de la réception pour retourner un article non utilisé dans son emballage d'origine. Contactez-nous avant tout retour à contact@dardmana.ma

## Article 8 — Droit applicable

Les présentes CGV sont soumises au droit marocain. Tout litige sera soumis aux tribunaux compétents de Rabat, Maroc.`,
  contentAr: `## المادة 1 — الموضوع

تحكم هذه الشروط العامة للبيع عمليات البيع التي تتم على موقع dardmana.ma من طرف دار ضمانة.

## المادة 2 — المنتجات

منتجاتنا هي إبداعات حرفية مغربية. الصور تمثيلية، لكن قد توجد اختلافات طبيعية طفيفة (الخشب الطبيعي، الأحجار شبه الكريمة).

## المادة 3 — الأسعار

تُعرض الأسعار بالدرهم المغربي (MAD) وباليورو (EUR) للطلبات الدولية، شاملةً جميع الرسوم. تحتفظ دار ضمانة بالحق في تعديل أسعارها في أي وقت.

## المادة 4 — الطلبات

كل طلب يعني قبول هذه الشروط العامة للبيع. سيُرسَل إليك تأكيد الطلب عبر البريد الإلكتروني خلال 24 ساعة.

## المادة 5 — الأداء

- المغرب: الدفع عند التسليم (COD) أو عبر الإنترنت
- دولي: دفع آمن عبر الإنترنت (Stripe)

بياناتك البنكية مشفّرة ومؤمّنة.

## المادة 6 — التوصيل

- المغرب: 24-48 ساعة (عادي) أو 24 ساعة (سريع)
- أوروبا: 7-10 أيام عمل
- دولي: 10-20 يوم عمل

تبدأ الآجال من تأكيد الطلب.

## المادة 7 — الإرجاع

لديك 7 أيام من تاريخ الاستلام لإرجاع منتج غير مستعمل في تغليفه الأصلي. تواصل معنا قبل أي إرجاع على contact@dardmana.ma

## المادة 8 — القانون المطبق

تخضع هذه الشروط العامة للبيع للقانون المغربي. يُعرض أي نزاع على المحاكم المختصة بالرباط، المغرب.`,
  contentEn: `## Article 1 — Purpose

These Terms and Conditions govern sales made on the dardmana.ma website by Dar Dmana.

## Article 2 — Products

Our products are Moroccan artisanal creations. Photos are representative, but slight natural variations may exist (natural wood, semi-precious stones).

## Article 3 — Prices

Prices are shown in MAD (Moroccan Dirham) and in EUR for international orders, all taxes included. Dar Dmana reserves the right to change its prices at any time.

## Article 4 — Orders

Any order implies acceptance of these Terms and Conditions. Order confirmation will be sent to you by email within 24 hours.

## Article 5 — Payment

- Morocco: cash on delivery (COD) or online payment
- International: secure online payment (Stripe)

Your banking details are encrypted and secured.

## Article 6 — Delivery

- Morocco: 24-48h (standard) or 24h (express)
- Europe: 7-10 business days
- International: 10-20 business days

Delivery times run from order confirmation.

## Article 7 — Returns

You have 7 days from receipt to return an unused item in its original packaging. Contact us before any return at contact@dardmana.ma

## Article 8 — Applicable Law

These Terms and Conditions are subject to Moroccan law. Any dispute will be submitted to the competent courts of Rabat, Morocco.`,
}

async function seedPage(page: typeof notreHistoire, published = false) {
  const existing = await prisma.cMSPage.findUnique({ where: { slug: page.slug }, select: { slug: true } })
  if (existing) {
    console.log(`• Page "${page.slug}" déjà présente — inchangée.`)
    return
  }
  await prisma.cMSPage.create({ data: { ...page, isPublished: published } })
  console.log(`✓ Page "${page.slug}" créée (${published ? 'publiée' : 'brouillon'}).`)
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
  await seedPage(faqPage)
  await seedPage(livraisonRetours)

  // Pages légales — publiées immédiatement.
  await seedPage(mentionsLegales, true)
  await seedPage(confidentialite, true)
  await seedPage(cgv, true)

  console.log('\n──────── Seed CMS terminé ────────')
}

main()
  .catch((e) => { console.error('❌ Erreur:', e.message); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
