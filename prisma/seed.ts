import { PrismaClient, ProductStatus, ProductType, PromoType, PaymentMethod, PaymentStatus, OrderStatus, OrderSource } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Dar Dmana database...')

  // ─── Categories ────────────────────────────────────────────────────────────

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'chapelet' },
      update: {},
      create: {
        slug: 'chapelet',
        nameFr: 'Chapelet',
        nameAr: 'سبحة',
        nameEn: 'Prayer Beads',
        descriptionFr: 'Chapelets artisanaux marocains en pierres naturelles, bois précieux et matériaux nobles. Chaque pièce est façonnée à la main par nos artisans de Fès.',
        descriptionAr: 'مسابح مغربية يدوية من الأحجار الطبيعية والخشب النفيس. كل قطعة مصنوعة يدوياً من قِبل حرفيينا في فاس.',
        descriptionEn: 'Moroccan handcrafted prayer beads in natural stones, precious woods and noble materials. Each piece is hand-fashioned by our artisans from Fez.',
        icon: '📿',
        sortOrder: 1,
        isActive: true,
        metaTitleFr: 'Chapelets Artisanaux Marocains | Dar Dmana',
        metaDescriptionFr: 'Découvrez notre collection de chapelets marocains artisanaux en pierres naturelles et bois précieux.',
      },
    }),

    prisma.category.upsert({
      where: { slug: 'bracelet' },
      update: {},
      create: {
        slug: 'bracelet',
        nameFr: 'Bracelet',
        nameAr: 'سوار',
        nameEn: 'Bracelet',
        descriptionFr: 'Bracelets berbères et andalous en argent, pierres semi-précieuses et cuir tressé. L\'art de la bijouterie marocaine dans toute sa splendeur.',
        descriptionAr: 'أساور بربرية وأندلسية من الفضة والأحجار شبه الكريمة والجلد المضفر. فن المجوهرات المغربية في كامل بهائه.',
        descriptionEn: 'Berber and Andalusian bracelets in silver, semi-precious stones and braided leather. The art of Moroccan jewelry in all its splendor.',
        icon: '💍',
        sortOrder: 2,
        isActive: true,
        metaTitleFr: 'Bracelets Berbères & Marocains | Dar Dmana',
        metaDescriptionFr: 'Bracelets artisanaux marocains en argent et pierres naturelles. Bijoux berbères authentiques.',
      },
    }),

    prisma.category.upsert({
      where: { slug: 'parfum' },
      update: {},
      create: {
        slug: 'parfum',
        nameFr: 'Parfum',
        nameAr: 'عطر',
        nameEn: 'Perfume',
        descriptionFr: 'Parfums orientaux marocains : rose de Dadès, ambre, musc blanc et oud. Des senteurs envoûtantes qui racontent l\'histoire de l\'artisanat olfactif du Maroc.',
        descriptionAr: 'عطور مغربية شرقية: وردة دادس، عنبر، مسك أبيض وعود. عطور آسرة تحكي تاريخ الحرف الشمية بالمغرب.',
        descriptionEn: 'Moroccan oriental perfumes: Dadès rose, amber, white musk and oud. Enchanting scents that tell the story of Morocco\'s olfactory craft.',
        icon: '🌹',
        sortOrder: 3,
        isActive: true,
        metaTitleFr: 'Parfums Orientaux Marocains | Dar Dmana',
        metaDescriptionFr: 'Parfums artisanaux marocains à base de rose, ambre et oud. Senteurs authentiques du Maroc.',
      },
    }),

    prisma.category.upsert({
      where: { slug: 'huile-essentielle' },
      update: {},
      create: {
        slug: 'huile-essentielle',
        nameFr: 'Huile Essentielle',
        nameAr: 'زيت أساسي',
        nameEn: 'Essential Oil',
        descriptionFr: 'Huiles essentielles pures du Maroc : argan, rose, eucalyptus du Rif, lavande de l\'Atlas. Extraites à froid, sans additif ni conservateur.',
        descriptionAr: 'زيوت أساسية نقية من المغرب: أرغان، وردة، أوكالبتوس الريف، لافندر الأطلس. مستخلصة على البارد بدون إضافات أو مواد حافظة.',
        descriptionEn: 'Pure essential oils from Morocco: argan, rose, Rif eucalyptus, Atlas lavender. Cold-extracted, with no additives or preservatives.',
        icon: '🌿',
        sortOrder: 4,
        isActive: true,
        metaTitleFr: 'Huiles Essentielles Pures du Maroc | Dar Dmana',
        metaDescriptionFr: 'Huiles essentielles bio marocaines : argan, rose de Dadès, lavande de l\'Atlas.',
      },
    }),

    prisma.category.upsert({
      where: { slug: 'pierre-precieuse' },
      update: {},
      create: {
        slug: 'pierre-precieuse',
        nameFr: 'Pierre Précieuse',
        nameAr: 'حجر كريم',
        nameEn: 'Precious Stone',
        descriptionFr: 'Pierres précieuses et semi-précieuses extraites des montagnes marocaines : améthyste de Bou Azzer, rubis d\'Asni, quartz de l\'Anti-Atlas. Brutes ou polies.',
        descriptionAr: 'أحجار كريمة وشبه كريمة مستخرجة من جبال المغرب: أمتيست بواز، روبي أسني، كوارتز أنتي أطلس. خام أو مصقولة.',
        descriptionEn: 'Precious and semi-precious stones mined from Moroccan mountains: Bou Azzer amethyst, Asni ruby, Anti-Atlas quartz. Raw or polished.',
        icon: '💎',
        sortOrder: 5,
        isActive: true,
        metaTitleFr: 'Pierres Précieuses du Maroc | Dar Dmana',
        metaDescriptionFr: 'Pierres précieuses et cristaux extraits des montagnes marocaines.',
      },
    }),

    prisma.category.upsert({
      where: { slug: 'collier' },
      update: {},
      create: {
        slug: 'collier',
        nameFr: 'Collier',
        nameAr: 'عقد',
        nameEn: 'Necklace',
        descriptionFr: 'Colliers berbères et citadins en argent massif, fibules traditionnelles et pièces de monnaie anciennes. Héritage vivant de l\'orfèvrerie marocaine.',
        descriptionAr: 'عقود بربرية ومدنية من الفضة الخالصة والإبزيم التقليدي والعملات القديمة. إرث حي من ذهبية المغرب.',
        descriptionEn: 'Berber and urban necklaces in solid silver, traditional fibulas and antique coins. A living heritage of Moroccan goldsmithing.',
        icon: '📿',
        sortOrder: 6,
        isActive: true,
        metaTitleFr: 'Colliers Berbères Artisanaux | Dar Dmana',
        metaDescriptionFr: 'Colliers artisanaux marocains en argent, fibules et bijoux traditionnels berbères.',
      },
    }),
  ])

  console.log(`✅ ${categories.length} catégories créées`)

  // ─── Products ──────────────────────────────────────────────────────────────

  const productData = [
    // Chapelet
    {
      slug: 'chapelet-ambre-jaune-33-grains',
      nameFr: 'Chapelet en Ambre Jaune — 33 Grains',
      nameAr: 'سبحة كهرمان أصفر — 33 حبة',
      nameEn: 'Yellow Amber Prayer Beads — 33 Grains',
      descriptionFr: 'Chapelet artisanal composé de 33 grains d\'ambre jaune naturel provenant des côtes africaines. Chaque grain est poli à la main, révélant des inclusions fossiles uniques. Le tassel est en soie naturelle tressée de couleur or.',
      descriptionAr: 'سبحة يدوية مكونة من 33 حبة كهرمان أصفر طبيعي من السواحل الأفريقية. كل حبة مصقولة يدوياً تكشف شوائب أحفورية فريدة. الشرابة من الحرير الطبيعي المضفر باللون الذهبي.',
      descriptionEn: 'Handcrafted prayer beads composed of 33 grains of natural yellow amber from African coasts. Each grain is hand-polished, revealing unique fossil inclusions. The tassel is in braided natural gold-colored silk.',
      shortDescFr: 'Ambre jaune naturel poli main, 33 grains, tassel soie or.',
      priceMad: '450.00',
      priceEur: '42.00',
      categorySlug: 'chapelet',
      stock: 12,
      isFeatured: true,
      isNew: false,
      tags: ['ambre', 'chapelet', 'artisanal', 'fes'],
    },
    {
      slug: 'chapelet-bois-santal-rouge-99-grains',
      nameFr: 'Chapelet Santal Rouge — 99 Grains',
      nameAr: 'سبحة خشب الصندل الأحمر — 99 حبة',
      nameEn: 'Red Sandalwood Prayer Beads — 99 Grains',
      descriptionFr: 'Magnifique chapelet de 99 grains taillés dans du santal rouge du Yémen, connu pour son parfum persistant et ses vertus apaisantes. Les grains sont reliés par un cordon en lin naturel avec un séparateur en argent 925.',
      descriptionAr: 'سبحة رائعة من 99 حبة منحوتة من خشب الصندل الأحمر اليمني، معروف بعطره المستمر وفوائده المهدئة. الحبات مرتبطة بخيط كتان طبيعي مع فاصل من الفضة 925.',
      descriptionEn: 'Magnificent prayer beads of 99 grains carved from Yemeni red sandalwood, known for its lasting fragrance and soothing properties. The grains are connected by a natural linen cord with a 925 silver separator.',
      shortDescFr: 'Santal rouge du Yémen, 99 grains, séparateur argent 925.',
      priceMad: '680.00',
      priceEur: '63.00',
      categorySlug: 'chapelet',
      stock: 8,
      isFeatured: false,
      isNew: true,
      tags: ['santal', 'chapelet', '99-grains', 'argent'],
    },
    {
      slug: 'chapelet-onyx-noir-33-grains',
      nameFr: 'Chapelet Onyx Noir — 33 Grains',
      nameAr: 'سبحة العقيق الأسود — 33 حبة',
      nameEn: 'Black Onyx Prayer Beads — 33 Grains',
      descriptionFr: 'Chapelet en onyx noir poli, pierre considérée dans la tradition islamique comme protectrice. Les 33 grains sphériques sont taillés à Marrakech dans un onyx de première qualité. Monture en argent gravé à l\'arabesque.',
      descriptionAr: 'سبحة من العقيق الأسود المصقول، حجر يُعتبر في التقليد الإسلامي واقياً. الـ33 حبة الكروية منحوتة في مراكش من عقيق درجة أولى. إطار من الفضة المنقوشة بالأرابيسك.',
      descriptionEn: 'Polished black onyx prayer beads, a stone considered protective in Islamic tradition. The 33 spherical grains are cut in Marrakech from first-grade onyx. Setting in silver engraved with arabesque.',
      shortDescFr: 'Onyx noir poli de qualité supérieure, gravure arabesque argent.',
      priceMad: '320.00',
      priceEur: '30.00',
      categorySlug: 'chapelet',
      stock: 20,
      isFeatured: false,
      isNew: false,
      tags: ['onyx', 'chapelet', 'marrakech', 'protection'],
    },

    // Bracelet
    {
      slug: 'bracelet-argent-amazigh-gravure',
      nameFr: 'Bracelet Amazigh en Argent Gravé',
      nameAr: 'سوار أمازيغي من الفضة المنقوشة',
      nameEn: 'Engraved Amazigh Silver Bracelet',
      descriptionFr: 'Bracelet en argent massif 925 orné de motifs géométriques amazighs gravés à la main par les artisans joailliers de Tiznit. Le motif central représente Tifinagh, l\'écriture berbère ancestrale. Ajustable de 16 à 20 cm.',
      descriptionAr: 'سوار من الفضة الخالصة 925 مزين بأنماط هندسية أمازيغية منقوشة يدوياً من قبل صائغي تيزنيت. النقش المركزي يمثل تيفيناغ، الكتابة البربرية الأصيلة. قابل للتعديل من 16 إلى 20 سم.',
      descriptionEn: 'Solid 925 silver bracelet adorned with Amazigh geometric patterns hand-engraved by the jewelry craftsmen of Tiznit. The central motif represents Tifinagh, the ancestral Berber script. Adjustable from 16 to 20 cm.',
      shortDescFr: 'Argent 925, motifs Tifinagh, artisans de Tiznit.',
      priceMad: '890.00',
      priceEur: '83.00',
      categorySlug: 'bracelet',
      stock: 6,
      isFeatured: true,
      isNew: false,
      tags: ['amazigh', 'argent', 'tiznit', 'tifinagh'],
    },
    {
      slug: 'bracelet-turquoise-atlas',
      nameFr: 'Bracelet Turquoise de l\'Atlas',
      nameAr: 'سوار فيروز الأطلس',
      nameEn: 'Atlas Turquoise Bracelet',
      descriptionFr: 'Bracelet composé de 7 cabochons de turquoise naturelle extraite des mines de l\'Atlas central, serties en argent oxydé. La turquoise marocaine est réputée pour ses nuances bleu-vert uniques. Livré dans un coffret artisanal en cèdre.',
      descriptionAr: 'سوار مكون من 7 كابوشونات من الفيروز الطبيعي المستخرج من مناجم الأطلس المتوسط، محاطة بالفضة المؤكسدة. الفيروز المغربي مشهور بظلاله الأزرق الأخضر الفريدة. يُسلَّم في علبة حرفية من خشب الأرز.',
      descriptionEn: 'Bracelet composed of 7 natural turquoise cabochons extracted from Central Atlas mines, set in oxidized silver. Moroccan turquoise is renowned for its unique blue-green hues. Delivered in a handcrafted cedar box.',
      shortDescFr: 'Turquoise naturelle de l\'Atlas, argent oxydé, coffret cèdre.',
      priceMad: '760.00',
      priceEur: '71.00',
      categorySlug: 'bracelet',
      stock: 9,
      isFeatured: false,
      isNew: true,
      tags: ['turquoise', 'atlas', 'argent', 'coffret'],
    },
    {
      slug: 'bracelet-cuir-tresse-safran',
      nameFr: 'Bracelet Cuir Tressé Safran',
      nameAr: 'سوار جلد مضفر بلون الزعفران',
      nameEn: 'Saffron Braided Leather Bracelet',
      descriptionFr: 'Bracelet en cuir tanné végétal de la tannerie Chouara de Fès, teint avec du safran pur de Taliouine. Le tressage en huit brins est réalisé à la main. Fermoir en argent berbère. Un bijou qui porte l\'âme de deux capitales artisanales.',
      descriptionAr: 'سوار من الجلد المدبوغ نباتياً من دباغة الشوارة في فاس، مصبوغ بزعفران خالص من تالووين. الضفيرة من ثمانية خيوط مصنوعة يدوياً. إغلاق بالفضة البربرية. مجوهر يحمل روح عاصمتين حرفيتين.',
      descriptionEn: 'Vegetable-tanned leather bracelet from Fez\'s Chouara tannery, dyed with pure saffron from Taliouine. The eight-strand braid is crafted by hand. Berber silver clasp. A jewel that carries the soul of two artisanal capitals.',
      shortDescFr: 'Cuir Chouara Fès, safran Taliouine, fermoir argent berbère.',
      priceMad: '290.00',
      priceEur: '27.00',
      categorySlug: 'bracelet',
      stock: 15,
      isFeatured: false,
      isNew: false,
      tags: ['cuir', 'fes', 'safran', 'taliouine'],
    },

    // Parfum
    {
      slug: 'parfum-rose-dades-pure-10ml',
      nameFr: 'Parfum Rose de Dadès Pure — 10ml',
      nameAr: 'عطر وردة دادس الخالص — 10 مل',
      nameEn: 'Pure Dadès Rose Perfume — 10ml',
      descriptionFr: 'Extrait de parfum à base d\'huile essentielle de rose de Dadès (Rosa damascena), récoltée à l\'aube dans la vallée des roses entre Boumalne et Kelaat M\'Gouna. Notes : tête rose fraîche, cœur rose absolue, fond musc blanc. Concentration 30% — tenue 8-12h.',
      descriptionAr: 'مستخلص عطر من زيت أساسي لوردة دادس (Rosa damascena)، محصودة عند الفجر في وادي الورود بين بومالن وقلعة مكونة. ملاحظات: رأس وردة طازجة، قلب وردة مطلقة، قاع مسك أبيض. تركيز 30% — ثبات 8-12 ساعة.',
      descriptionEn: 'Perfume extract based on Dadès rose (Rosa damascena) essential oil, harvested at dawn in the Valley of Roses between Boumalne and Kelaat M\'Gouna. Notes: fresh rose head, rose absolue heart, white musk base. 30% concentration — hold 8-12h.',
      shortDescFr: 'Rosa damascena vallée des roses, 30% concentration, 10ml.',
      priceMad: '580.00',
      priceEur: '54.00',
      categorySlug: 'parfum',
      stock: 18,
      isFeatured: true,
      isNew: false,
      tags: ['rose', 'dades', 'parfum', 'naturel'],
    },
    {
      slug: 'parfum-oud-atlas-30ml',
      nameFr: 'Parfum Oud Atlas — 30ml',
      nameAr: 'عطر عود الأطلس — 30 مل',
      nameEn: 'Atlas Oud Perfume — 30ml',
      descriptionFr: 'Parfum oriental à base d\'oud marocain et de résines de l\'Atlas. Notes pyramidales : bergamote et cèdre en tête, oud fumé et iris en cœur, ambre gris et santal en fond. Un voyage olfactif au cœur du Moyen Atlas. Flacon en verre soufflé artisanal.',
      descriptionAr: 'عطر شرقي من العود المغربي وراتنجات الأطلس. ملاحظات هرمية: برغموت وأرز في الرأس، عود مدخن وأيريس في القلب، عنبر رمادي وصندل في القاعدة. رحلة شمية في قلب الأطلس المتوسط. قارورة من الزجاج المنفوخ يدوياً.',
      descriptionEn: 'Oriental perfume based on Moroccan oud and Atlas resins. Pyramidal notes: bergamot and cedar at the head, smoky oud and iris at the heart, grey amber and sandalwood at the base. An olfactory journey to the heart of the Middle Atlas. Handblown glass bottle.',
      shortDescFr: 'Oud marocain, résines Atlas, flacon verre soufflé, 30ml.',
      priceMad: '1200.00',
      priceEur: '112.00',
      comparePriceMad: '1450.00',
      categorySlug: 'parfum',
      stock: 7,
      isFeatured: true,
      isNew: false,
      tags: ['oud', 'atlas', 'oriental', 'luxe'],
    },
    {
      slug: 'parfum-ambre-blanc-musc-15ml',
      nameFr: 'Parfum Ambre Blanc & Musc — 15ml',
      nameAr: 'عطر العنبر الأبيض والمسك — 15 مل',
      nameEn: 'White Amber & Musk Perfume — 15ml',
      descriptionFr: 'Parfum délicat alliant ambre blanc et musc naturel. Notes : tête fleur d\'oranger de Meknès, cœur jasmin sambac, fond ambre blanc et musc éthiopien. Idéal après le bain. Sans alcool — base d\'huile de jojoba. Convient à toute la famille.',
      descriptionAr: 'عطر رقيق يجمع العنبر الأبيض والمسك الطبيعي. ملاحظات: رأس زهر البرتقال من مكناس، قلب ياسمين سامباك، قاعدة عنبر أبيض ومسك إثيوبي. مثالي بعد الاستحمام. بدون كحول — قاعدة زيت جوجوبا. مناسب للعائلة بأكملها.',
      descriptionEn: 'Delicate perfume combining white amber and natural musk. Notes: Meknès orange blossom head, sambac jasmine heart, white amber and Ethiopian musk base. Ideal after bathing. Alcohol-free — jojoba oil base. Suitable for the whole family.',
      shortDescFr: 'Ambre blanc, musc éthiopien, fleur oranger Meknès, sans alcool.',
      priceMad: '340.00',
      priceEur: '32.00',
      categorySlug: 'parfum',
      stock: 25,
      isFeatured: false,
      isNew: true,
      tags: ['ambre', 'musc', 'sans-alcool', 'meknes'],
    },

    // Huile essentielle
    {
      slug: 'huile-argan-cosmétique-100ml',
      nameFr: 'Huile d\'Argan Cosmétique — 100ml',
      nameAr: 'زيت الأرغان التجميلي — 100 مل',
      nameEn: 'Cosmetic Argan Oil — 100ml',
      descriptionFr: 'Huile d\'argan vierge extraite à froid de noix d\'argane récoltées à la main dans la réserve de biosphère de l\'Arganeraie (UNESCO). Produite par une coopérative de femmes soussies. Riche en tocophérols et acides gras essentiels. Certifiée bio ECOCERT.',
      descriptionAr: 'زيت أرغان بكر مستخلص بالبرد من بذور الأرغان المحصودة يدوياً في محمية المحيط الحيوي لغابة الأرغان (يونسكو). منتج من قِبل تعاونية نساء سوسيات. غني بالتوكوفيرولات والأحماض الدهنية الأساسية. معتمد عضوياً ECOCERT.',
      descriptionEn: 'Virgin argan oil cold-extracted from hand-harvested argan nuts in the Argan Biosphere Reserve (UNESCO). Produced by a cooperative of Soussian women. Rich in tocopherols and essential fatty acids. Certified organic ECOCERT.',
      shortDescFr: 'Argan vierge bio ECOCERT, coopérative femmes soussies, 100ml.',
      priceMad: '280.00',
      priceEur: '26.00',
      categorySlug: 'huile-essentielle',
      stock: 30,
      isFeatured: true,
      isNew: false,
      tags: ['argan', 'bio', 'ecocert', 'coopérative'],
    },
    {
      slug: 'huile-essentielle-rose-dades-5ml',
      nameFr: 'Huile Essentielle Rose de Dadès — 5ml',
      nameAr: 'زيت أساسي وردة دادس — 5 مل',
      nameEn: 'Dadès Rose Essential Oil — 5ml',
      descriptionFr: 'Huile essentielle pure de Rosa damascena distillée à la vapeur d\'eau dans les distilleries artisanales de Kelaat M\'Gouna. Saison de récolte : avril-mai. 1 ml d\'huile essentielle nécessite 4 kg de pétales. Vertus : régénérante, apaisante, harmonisante.',
      descriptionAr: 'زيت أساسي خالص من وردة Rosa damascena مقطر بالبخار في المقطرات الحرفية لقلعة مكونة. موسم الحصاد: أبريل-مايو. 1 مل من الزيت يتطلب 4 كجم من البتلات. فوائد: مجددة، مهدئة، منسقة.',
      descriptionEn: 'Pure Rosa damascena essential oil steam-distilled in the artisan distilleries of Kelaat M\'Gouna. Harvest season: April-May. 1ml of essential oil requires 4kg of petals. Benefits: regenerating, soothing, harmonizing.',
      shortDescFr: '100% pure, distillation vapeur, 4 kg pétales/ml, 5ml.',
      priceMad: '750.00',
      priceEur: '70.00',
      categorySlug: 'huile-essentielle',
      stock: 14,
      isFeatured: false,
      isNew: false,
      tags: ['rose', 'essentielle', 'dades', 'distillation'],
    },
    {
      slug: 'huile-nigelle-black-seed-250ml',
      nameFr: 'Huile de Nigelle Marocaine — 250ml',
      nameAr: 'زيت حبة البركة المغربية — 250 مل',
      nameEn: 'Moroccan Black Seed Oil — 250ml',
      descriptionFr: 'Huile de nigelle (Nigella sativa) pressée à froid, produite dans les plaines du Gharb. Riche en thymoquinone, oméga-6 et oméga-9. Utilisée depuis des siècles dans la médecine traditionnelle marocaine (Attar). En alimentation ou en application topique.',
      descriptionAr: 'زيت حبة البركة (Nigella sativa) معصور بالبرد، منتج في سهول الغرب. غني بالثيموكينون وأوميغا-6 وأوميغا-9. مستخدم منذ قرون في الطب التقليدي المغربي (العطار). في التغذية أو التطبيق الموضعي.',
      descriptionEn: 'Cold-pressed black seed oil (Nigella sativa), produced in the Gharb plains. Rich in thymoquinone, omega-6 and omega-9. Used for centuries in traditional Moroccan medicine (Attar). In nutrition or topical application.',
      shortDescFr: 'Nigella sativa pressée froid, riche thymoquinone, 250ml.',
      priceMad: '180.00',
      priceEur: '17.00',
      categorySlug: 'huile-essentielle',
      stock: 40,
      isFeatured: false,
      isNew: false,
      tags: ['nigelle', 'black-seed', 'gharb', 'traditionnel'],
    },

    // Pierre précieuse
    {
      slug: 'amethyste-bou-azzer-brute',
      nameFr: 'Améthyste Brute de Bou Azzer',
      nameAr: 'جمشت خام من بواز',
      nameEn: 'Raw Amethyst from Bou Azzer',
      descriptionFr: 'Géode d\'améthyste naturelle extraite des mines de Bou Azzer dans l\'Anti-Atlas. Couleur violet profond caractéristique de la région. Poids moyen 200-300g. Chaque pièce est unique, livrée avec certificat d\'origine. Idéale pour la lithothérapie ou la décoration.',
      descriptionAr: 'جيود أمتيست طبيعي مستخرج من مناجم بواز في أنتي أطلس. لون بنفسجي عميق مميز للمنطقة. وزن متوسط 200-300 جرام. كل قطعة فريدة، تُسلَّم مع شهادة منشأ. مثالية للعلاج بالأحجار أو الديكور.',
      descriptionEn: 'Natural amethyst geode extracted from Bou Azzer mines in the Anti-Atlas. Deep violet color characteristic of the region. Average weight 200-300g. Each piece is unique, delivered with certificate of origin. Ideal for lithotherapy or decoration.',
      shortDescFr: 'Améthyste naturelle Anti-Atlas, 200-300g, certificat d\'origine.',
      priceMad: '420.00',
      priceEur: '39.00',
      categorySlug: 'pierre-precieuse',
      stock: 11,
      isFeatured: true,
      isNew: false,
      tags: ['amethyste', 'bou-azzer', 'lithothérapie', 'anti-atlas'],
    },
    {
      slug: 'quartz-rose-atlas-polie',
      nameFr: 'Quartz Rose de l\'Atlas Poli',
      nameAr: 'كوارتز وردي مصقول من الأطلس',
      nameEn: 'Polished Atlas Rose Quartz',
      descriptionFr: 'Sphère de quartz rose poli extraite du Haut Atlas marocain. Diamètre 6-7 cm, poids 350-450g. La teinte rose pâle translucide est due à des traces de titane. Pierre de l\'amour et de l\'harmonie dans toutes les traditions. Socle en thuya de Mogador inclus.',
      descriptionAr: 'كرة من الكوارتز الوردي المصقول مستخرجة من الأطلس الكبير المغربي. قطر 6-7 سم، وزن 350-450 جرام. اللون الوردي الشفاف الفاتح ناتج عن آثار من التيتانيوم. حجر الحب والانسجام في جميع التقاليد. قاعدة من خشب الأثل (ثويا موغادور) مدرجة.',
      descriptionEn: 'Polished rose quartz sphere extracted from the Moroccan High Atlas. Diameter 6-7 cm, weight 350-450g. The translucent pale pink hue is due to titanium traces. Stone of love and harmony in all traditions. Mogador thuya base included.',
      shortDescFr: 'Sphère quartz rose Haut Atlas, ⌀6-7cm, socle thuya Mogador.',
      priceMad: '350.00',
      priceEur: '33.00',
      categorySlug: 'pierre-precieuse',
      stock: 16,
      isFeatured: false,
      isNew: true,
      tags: ['quartz', 'rose', 'haut-atlas', 'thuya'],
    },
    {
      slug: 'malachite-veine-cuivre-maroc',
      nameFr: 'Malachite Veinée — Cuivre du Maroc',
      nameAr: 'مالاكيت متعرق — نحاس المغرب',
      nameEn: 'Veined Malachite — Morocco Copper',
      descriptionFr: 'Dalle de malachite naturelle aux motifs tourbillonnants verts provenant des anciennes mines de cuivre de Midelt. Dimensions 10×8 cm environ. La malachite marocaine est parmi les plus belles au monde grâce à ses veinages vert émeraude et vert menthe. Pièce unique de collection.',
      descriptionAr: 'لوح من المالاكيت الطبيعي بأنماط دوامية خضراء من مناجم النحاس القديمة في ميدلت. أبعاد نحو 10×8 سم. المالاكيت المغربي من أجمل العالم بفضل تعرقاته الزمردية والنعنعية. قطعة تحف فريدة.',
      descriptionEn: 'Natural malachite slab with swirling green patterns from the ancient copper mines of Midelt. Dimensions approximately 10×8 cm. Moroccan malachite is among the world\'s most beautiful due to its emerald and mint green veinings. Unique collector\'s piece.',
      shortDescFr: 'Malachite Midelt, veinages émeraude/menthe, 10×8cm, pièce unique.',
      priceMad: '620.00',
      priceEur: '58.00',
      categorySlug: 'pierre-precieuse',
      stock: 5,
      isFeatured: false,
      isNew: false,
      tags: ['malachite', 'midelt', 'cuivre', 'collection'],
    },

    // Collier
    {
      slug: 'collier-fibule-tiznit-argent',
      nameFr: 'Collier Fibule Tiznit en Argent',
      nameAr: 'عقد إبزيم تيزنيت من الفضة',
      nameEn: 'Tiznit Silver Fibula Necklace',
      descriptionFr: 'Collier composé d\'une fibule triangulaire tiznite en argent 925 ornée de granulation et d\'émail bleu. La fibule est complétée par des chaînes en maille berbère et de petites perles de corail. Longueur totale : 45 cm. Pièce inspirée des parures du Souss-Massa.',
      descriptionAr: 'عقد يتكون من إبزيم مثلث تيزنيتي من الفضة 925 مزين بالتحبيب والمينا الزرقاء. الإبزيم مكمّل بسلاسل من حلقات بربرية وخرزات صغيرة من المرجان. الطول الكلي: 45 سم. قطعة مستوحاة من حلي سوس-ماسة.',
      descriptionEn: 'Necklace composed of a triangular Tiznit fibula in 925 silver adorned with granulation and blue enamel. The fibula is complemented by Berber mesh chains and small coral beads. Total length: 45 cm. Piece inspired by the jewelry of Souss-Massa.',
      shortDescFr: 'Fibule triangulaire Tiznit, argent 925, granulation, corail, 45cm.',
      priceMad: '1450.00',
      priceEur: '135.00',
      categorySlug: 'collier',
      stock: 4,
      isFeatured: true,
      isNew: false,
      tags: ['fibule', 'tiznit', 'argent', 'corail', 'souss'],
    },
    {
      slug: 'collier-ambre-corail-traditionnel',
      nameFr: 'Collier Ambre & Corail Traditionnel',
      nameAr: 'عقد كهرمان ومرجان تقليدي',
      nameEn: 'Traditional Amber & Coral Necklace',
      descriptionFr: 'Collier de mariée traditionnel alternant perles d\'ambre naturel et perles de corail rouge méditerranéen. 48 perles en total, chacune percée à la main par les artisans de Rissani. Ce type de collier était offert en dot dans les tribus berbères du Tafilalet.',
      descriptionAr: 'عقد عروس تقليدي يتناوب بين حبات الكهرمان الطبيعي وحبات المرجان الأحمر المتوسطي. 48 حبة في المجموع، كل منها مثقوبة يدوياً من قبل حرفيي الريصاني. هذا النوع من العقود كان يُقدَّم مهراً في القبائل البربرية بتافيلالت.',
      descriptionEn: 'Traditional bridal necklace alternating natural amber beads and red Mediterranean coral beads. 48 beads in total, each hand-pierced by the craftsmen of Rissani. This type of necklace was offered as a dowry in the Berber tribes of Tafilalet.',
      shortDescFr: 'Ambre naturel + corail méditerranéen, 48 perles, Rissani, dot berbère.',
      priceMad: '2100.00',
      priceEur: '196.00',
      categorySlug: 'collier',
      stock: 3,
      isFeatured: true,
      isNew: false,
      tags: ['ambre', 'corail', 'mariage', 'rissani', 'tafilalet'],
    },
    {
      slug: 'collier-pièces-argent-chleuh',
      nameFr: 'Collier Pièces Argent Chleuh',
      nameAr: 'عقد قطع الفضة الشلوح',
      nameEn: 'Chleuh Silver Coins Necklace',
      descriptionFr: 'Collier ethnique composé de reproductions de pièces de monnaie berbères chleuh en argent repoussé, entrelacées de chaînes en maille palmier. Les motifs stellaires et les inscriptions reproduisent les anciennes monnaies de la région de Taroudant. Longueur : 50 cm.',
      descriptionAr: 'عقد إثني مكون من مستنسخات عملات بربرية شلحية من الفضة المطروقة، متشابكة بسلاسل من حلقات النخلة. الأنماط النجمية والنقوش تعيد إنتاج العملات القديمة من منطقة تارودانت. الطول: 50 سم.',
      descriptionEn: 'Ethnic necklace composed of reproductions of Chleuh Berber coins in repousse silver, interlaced with palm-link chains. Stellar patterns and inscriptions reproduce the ancient coins of the Taroudant region. Length: 50 cm.',
      shortDescFr: 'Pièces berbères chleuh repoussées, chaîne palmier, Taroudant, 50cm.',
      priceMad: '980.00',
      priceEur: '91.00',
      categorySlug: 'collier',
      stock: 7,
      isFeatured: false,
      isNew: true,
      tags: ['chleuh', 'pièces', 'taroudant', 'berbère'],
    },
  ]

  let productCount = 0
  for (const p of productData) {
    const category = categories.find((c) => c.slug === p.categorySlug)
    if (!category) continue

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        nameFr: p.nameFr,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionFr: p.descriptionFr,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        shortDescFr: p.shortDescFr,
        priceMad: p.priceMad,
        priceEur: p.priceEur ?? null,
        comparePriceMad: p.comparePriceMad ?? null,
        categoryId: category.id,
        images: [],
        stock: p.stock,
        status: ProductStatus.ACTIVE,
        type: ProductType.PHYSICAL,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        tags: p.tags,
      },
    })
    productCount++
  }

  console.log(`✅ ${productCount} produits créés`)

  // ─── Shipping methods ──────────────────────────────────────────────────────

  await prisma.shippingMethod.upsert({
    where: { id: 'ship-maroc-standard' },
    update: {},
    create: {
      id: 'ship-maroc-standard',
      name: 'Livraison Standard Maroc',
      carrier: 'Amana / Chronopost Maroc',
      countries: ['MA'],
      priceMad: '35.00',
      priceEur: null,
      minDays: 2,
      maxDays: 5,
      freeThresholdMad: '500.00',
      isActive: true,
      sortOrder: 1,
    },
  })

  await prisma.shippingMethod.upsert({
    where: { id: 'ship-international' },
    update: {},
    create: {
      id: 'ship-international',
      name: 'Livraison Internationale',
      carrier: 'DHL Express / La Poste',
      countries: ['FR', 'BE', 'CH', 'ES', 'DE', 'IT', 'NL', 'GB', 'CA', 'US'],
      priceMad: '180.00',
      priceEur: '17.00',
      minDays: 5,
      maxDays: 12,
      freeThresholdMad: '2000.00',
      isActive: true,
      sortOrder: 2,
    },
  })

  console.log('✅ 2 méthodes de livraison créées')

  // ─── Promo codes ───────────────────────────────────────────────────────────

  await prisma.promoCode.upsert({
    where: { code: 'BIENVENUE10' },
    update: {},
    create: {
      code: 'BIENVENUE10',
      type: PromoType.PERCENT,
      value: '10.00',
      minOrderMad: '200.00',
      maxUses: 1000,
      isActive: true,
    },
  })

  await prisma.promoCode.upsert({
    where: { code: 'MAROC25' },
    update: {},
    create: {
      code: 'MAROC25',
      type: PromoType.FIXED_MAD,
      value: '25.00',
      minOrderMad: '150.00',
      maxUses: null,
      isActive: true,
    },
  })

  console.log('✅ 2 codes promo créés')

  // ─── BrandStats (singleton) ──────────────────────────────────────────────────
  // Une seule ligne, créée si absente. Valeurs de départ à 0/100 — l'admin les
  // met à jour manuellement (pas d'intégration API TikTok/Google).

  const existingStats = await prisma.brandStats.findFirst()
  if (!existingStats) {
    await prisma.brandStats.create({
      data: {
        tiktokFollowers: 0,
        tiktokLikes: 0,
        tiktokHandle: '@dardmana',
        googleRating: 0,
        googleReviewsCount: 0,
        satisfactionRate: 100,
      },
    })
    console.log('✅ BrandStats initialisé (singleton)')
  } else {
    console.log('ℹ️  BrandStats déjà présent — ignoré')
  }

  console.log('🎉 Seed terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
