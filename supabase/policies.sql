-- ============================================================================
-- Dar Dmana — Row Level Security (RLS) pour Supabase
-- ============================================================================
-- Modèle de sécurité :
--   • Toutes les écritures et les lectures sensibles passent par nos API routes
--     Next.js, qui utilisent Prisma via DATABASE_URL (rôle "postgres",
--     PROPRIÉTAIRE des tables → bypass RLS) ou SUPABASE_SERVICE_ROLE_KEY.
--   • La clé publique NEXT_PUBLIC_SUPABASE_ANON_KEY n'est utilisée QUE pour
--     Supabase Auth — JAMAIS pour interroger ces tables. (Vérifié dans le code.)
--   • On active donc RLS partout. Les rôles "anon"/"authenticated" (API REST
--     publique PostgREST) n'ont accès QU'aux lectures publiques explicitement
--     autorisées ci-dessous ; tout le reste est refusé par défaut.
--
-- À exécuter dans : Supabase Dashboard → SQL Editor (ou psql via DIRECT_URL).
-- Idempotent : peut être relancé sans risque.
-- ============================================================================

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 1. TABLES À LECTURE PUBLIQUE                                              │
-- │    anon + authenticated : SELECT autorisé (filtré). Écritures refusées.  │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Category : catégories actives
ALTER TABLE "public"."Category" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_category" ON "public"."Category";
CREATE POLICY "public_read_category" ON "public"."Category"
  FOR SELECT TO anon, authenticated USING ("isActive" = true);

-- Product : produits actifs uniquement (pas les brouillons/archivés)
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product" ON "public"."Product";
CREATE POLICY "public_read_product" ON "public"."Product"
  FOR SELECT TO anon, authenticated USING ("status" = 'ACTIVE');

-- ProductVariant : variantes actives
ALTER TABLE "public"."ProductVariant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_variant" ON "public"."ProductVariant";
CREATE POLICY "public_read_product_variant" ON "public"."ProductVariant"
  FOR SELECT TO anon, authenticated USING ("isActive" = true);

-- ShippingMethod : modes de livraison actifs (prix publics)
ALTER TABLE "public"."ShippingMethod" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_shipping_method" ON "public"."ShippingMethod";
CREATE POLICY "public_read_shipping_method" ON "public"."ShippingMethod"
  FOR SELECT TO anon, authenticated USING ("isActive" = true);

-- Review : avis approuvés uniquement
ALTER TABLE "public"."Review" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_review" ON "public"."Review";
CREATE POLICY "public_read_review" ON "public"."Review"
  FOR SELECT TO anon, authenticated USING ("isApproved" = true);

-- GuestbookEntry : témoignages approuvés uniquement
ALTER TABLE "public"."GuestbookEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_guestbook" ON "public"."GuestbookEntry";
CREATE POLICY "public_read_guestbook" ON "public"."GuestbookEntry"
  FOR SELECT TO anon, authenticated USING ("isApproved" = true);

-- CMSPage : pages publiées uniquement
ALTER TABLE "public"."CMSPage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cms_page" ON "public"."CMSPage";
CREATE POLICY "public_read_cms_page" ON "public"."CMSPage"
  FOR SELECT TO anon, authenticated USING ("isPublished" = true);

-- BrandStats : statistiques marketing publiques (followers, note Google…)
ALTER TABLE "public"."BrandStats" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_brand_stats" ON "public"."BrandStats";
CREATE POLICY "public_read_brand_stats" ON "public"."BrandStats"
  FOR SELECT TO anon, authenticated USING (true);

-- SiteSettings : nom du site + logo (publics, affichés sur le site)
ALTER TABLE "public"."SiteSettings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_site_settings" ON "public"."SiteSettings";
CREATE POLICY "public_read_site_settings" ON "public"."SiteSettings"
  FOR SELECT TO anon, authenticated USING (true);

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 2. TABLES SENSIBLES                                                       │
-- │    RLS activé SANS aucune policy → anon/authenticated = AUCUN accès.      │
-- │    Accès uniquement serveur (Prisma rôle postgres / service_role).       │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE "public"."Customer"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Address"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderStatusHistory"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TrackingEvent"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PromoCode"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Wishlist"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NotificationLog"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditLog"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminUser"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DeliverySettings"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AbandonedCart"       ENABLE ROW LEVEL SECURITY;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 3. TABLE TECHNIQUE PRISMA                                                 │
-- │    Flaggée aussi par l'Advisor. RLS activé, aucun accès anon.            │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Vérification : doit renvoyer 0 ligne (toutes les tables ont RLS activé)
-- ============================================================================
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;
