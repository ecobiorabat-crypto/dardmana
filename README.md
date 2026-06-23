# Dar Dmana — Maison de luxe marocaine

Boutique e-commerce haut de gamme dédiée à l'artisanat marocain. Design « luxe minimaliste » (références Rolex / Louis Vuitton), multilingue (FR / AR / EN avec support RTL), paiement à la livraison (COD), CMI et Stripe international, tableau de bord d'administration complet, et orchestration automatique des commandes (stock, emails, expédition).

---

## 1. Présentation du projet

Dar Dmana est une boutique en ligne « clé en main » comprenant :

- **Vitrine publique** : page d'accueil immersive, catalogue filtrable, fiches produit (galerie zoom, variantes, avis), panier, tunnel de commande en 4 étapes, espace client.
- **Internationalisation** : 3 langues (français par défaut, arabe avec mise en page RTL, anglais) via `next-intl`.
- **Paiements** : COD (Maroc), CMI (carte marocaine), Stripe (international).
- **Back-office admin** : dashboard KPI, opérations du jour, commandes, produits, clients, stock, coupons, analytics, paramètres.
- **Automatisation** : un orchestrateur déclenche, à chaque commande, la vérification/réservation du stock, les emails transactionnels et la création d'expédition (Amana avec repli manuel).
- **SEO** : `sitemap.xml`, `robots.txt`, Open Graph / Twitter Cards, données structurées JSON-LD (Product, Organization, WebSite, ItemList).

---

## 2. Stack technique

| Domaine | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Langage | TypeScript 5 (strict) |
| Styles | Tailwind CSS v4 + variables CSS du design system |
| i18n | next-intl 4 (FR / AR / EN, RTL) |
| Base de données | PostgreSQL (Supabase) via Prisma 7 (`@prisma/adapter-pg`) |
| Auth client | Supabase Auth (`@supabase/ssr`) |
| Auth admin | JWT signé maison (cookie httpOnly) |
| Paiement | Stripe (`@stripe/react-stripe-js`, Stripe Elements) |
| Images | Cloudinary (`next-cloudinary`) + `next/image` |
| Emails | Resend |
| State | Zustand (panier, wishlist, UI) |
| Animations | Framer Motion |
| Graphiques (admin) | Recharts |
| Validation | Zod |

---

## 3. Prérequis

- **Node.js 20+** et npm 10+
- Un **compte Supabase** (base PostgreSQL + Auth)
- Un **compte Stripe** (clés API + webhook)
- *(Optionnel mais recommandé)* comptes **Cloudinary** (images), **Resend** (emails), **WhatsApp Business API**

---

## 4. Installation (6 étapes)

```bash
# 1. Cloner le dépôt
git clone <url-du-repo> dar-dmana && cd dar-dmana

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement à partir de l'exemple
cp .env.example .env.local

# 4. Renseigner les variables dans .env.local (voir section 5)
#    puis générer le client Prisma
npx prisma generate

# 5. Appliquer le schéma à la base Supabase + (optionnel) données de démo
npx prisma migrate deploy   # ou: npx prisma db push
npx prisma db seed          # jeu de données de démonstration

# 6. Lancer le serveur de développement
npm run dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000).

> Astuce : en local, `npx prisma db push` synchronise le schéma sans créer de migration. En production, préférez `npx prisma migrate deploy`.

---

## 5. Variables d'environnement

Toutes les variables sont listées dans `.env.example`. Détail :

### Base de données

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL Supabase (`postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`). Utilisée par Prisma. |

### Supabase (auth client)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique du projet Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme publique (auth côté navigateur). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (opérations serveur privilégiées). **À garder secrète.** |

### Stripe (paiement international)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_...`) utilisée par Stripe Elements. |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_...`) côté serveur. |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (`whsec_...`) pour vérifier `/api/webhooks/stripe`. |

### Cloudinary (images)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary (widget d'upload admin). |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary. |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary. **À garder secret.** |

### Resend (emails transactionnels)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Clé API Resend (`re_...`) pour les emails (confirmation, expédition, alertes). |

### Application & Admin

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL publique du site (ex. `https://dardmana.ma`). Utilisée pour le sitemap, les URLs canoniques et les retours Stripe. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Locale par défaut (`fr`). |
| `ADMIN_EMAIL` | Email du compte administrateur principal. |
| `ADMIN_PASSWORD_HASH` | Hash SHA-256 du mot de passe admin (voir section 9). |
| `ADMIN_JWT_SECRET` | Secret (≥ 64 caractères aléatoires) pour signer le JWT admin. **Critique.** |
| `ADMIN_NAME` | Nom affiché de l'admin principal. |
| `ADMIN_USERS_JSON` | *(Optionnel)* JSON décrivant des admins supplémentaires et leurs rôles. |

### WhatsApp Business API *(optionnel)*

| Variable | Description |
|---|---|
| `WHATSAPP_VERIFY_TOKEN` | Jeton de vérification du webhook (choisi librement). |
| `WHATSAPP_ACCESS_TOKEN` | Token d'accès permanent de l'app Meta. |
| `WHATSAPP_PHONE_NUMBER_ID` | Identifiant du numéro WhatsApp Business. |

### Transporteur *(optionnel)*

| Variable | Description |
|---|---|
| `AMANA_API_KEY` | Clé API Amana (Poste Maroc). Si absente, repli automatique sur le mode manuel. Peut aussi être saisie via **Admin → Paramètres → Livraison** (stockée chiffrée). |
| `CTM_API_KEY` | Clé API CTM Messagerie. Même comportement de repli que ci-dessus. |
| `ENCRYPTION_KEY` | Secret de chiffrement des clés transporteurs stockées en base. À défaut, dérivé d'`ADMIN_JWT_SECRET`. **Définir une vraie valeur en production.** |

> Sur Vercel, toutes ces variables doivent être ajoutées dans **Project → Settings → Environment Variables**. Les variables `NEXT_PUBLIC_*` sont exposées au navigateur ; les autres restent côté serveur.

---

## 6. Déploiement Vercel (étapes exactes)

1. Poussez le code sur un dépôt GitHub/GitLab/Bitbucket.
2. Sur [vercel.com](https://vercel.com), **Add New → Project**, importez le dépôt.
3. Vercel détecte automatiquement Next.js (le `vercel.json` fixe le framework et la région `cdg1` — Paris).
4. Dans **Settings → Environment Variables**, ajoutez toutes les variables de la section 5 (environnements *Production* et *Preview*).
5. Cliquez sur **Deploy**. Vercel exécute `npm install` puis `npm run build`.
6. Après le premier déploiement, mettez `NEXT_PUBLIC_APP_URL` à l'URL de production puis **redéployez**.
7. Appliquez le schéma à la base si nécessaire : `npx prisma migrate deploy` (depuis votre machine, pointée sur la `DATABASE_URL` de production).
8. Configurez le webhook Stripe (section 7) avec l'URL de production.

> Note : la migration de schéma et le seed ne sont **pas** exécutés automatiquement par Vercel — lancez-les manuellement ou via une étape CI dédiée.

---

## 7. Configuration Stripe webhooks

1. Dashboard Stripe → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL** : `https://VOTRE_DOMAINE/api/webhooks/stripe`.
3. **Events à écouter** (au minimum) :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copiez le **Signing secret** (`whsec_...`) dans la variable `STRIPE_WEBHOOK_SECRET` sur Vercel, puis redéployez.
5. Le `vercel.json` force `Cache-Control: no-store` sur `/api/webhooks/*` pour éviter toute mise en cache.
6. Testez avec la Stripe CLI : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

---

## 8. Configuration WhatsApp Business API

1. Créez une app sur [developers.facebook.com](https://developers.facebook.com) et ajoutez le produit **WhatsApp**.
2. Récupérez le **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`, et un **token d'accès permanent** → `WHATSAPP_ACCESS_TOKEN`.
3. Choisissez un **Verify Token** arbitraire → `WHATSAPP_VERIFY_TOKEN`.
4. Dans **WhatsApp → Configuration → Webhook** :
   - **Callback URL** : `https://VOTRE_DOMAINE/api/webhooks/whatsapp`
   - **Verify Token** : la valeur de `WHATSAPP_VERIFY_TOKEN`
   - Abonnez-vous au champ **messages**.
5. Meta envoie une requête `GET` de vérification ; la route répond avec le `hub.challenge` si le token correspond.
6. Les messages entrants arrivent ensuite en `POST` sur la même route.

---

## 8b. Notifications WhatsApp admin via CallMeBot (gratuit, sans API Business)

Reçois une alerte WhatsApp sur ton téléphone à **chaque nouvelle commande**, sans
WhatsApp Business API. On utilise [CallMeBot](https://www.callmebot.com), gratuit.

**Obtenir ta clé API (≈ 2 minutes) :**

1. Enregistre le numéro **+34 644 59 77 81** dans tes contacts.
2. Depuis WhatsApp, envoie-lui le message exact :
   `I allow callmebot.com to send me messages`
3. Tu reçois en réponse ton **apikey** (ex. `123456`).

**Configuration :**

1. Dans `.env.local` (et sur Vercel → Project Settings → Environment Variables) :
   ```bash
   CALLMEBOT_API_KEY=123456          # la clé reçue
   CALLMEBOT_PHONE=212600000000      # ton numéro (défaut si non défini en admin)
   ```
2. Dans l'admin **Paramètres → Identité & logo → Notifications WhatsApp** :
   - Active le toggle **« Recevoir les commandes sur WhatsApp »**.
   - Renseigne ton **Numéro WhatsApp admin** (celui enregistré chez CallMeBot).
3. À chaque commande traitée par l'orchestrateur, tu reçois un message :
   ```
   🛒 Nouvelle commande Dar Dmana !
   N° DD-XXXX
   Client : … — +212…
   Produits : …
   Total : … MAD
   Paiement : COD
   Source : SHOP
   ```

> L'envoi est **non bloquant** : si la clé est absente ou CallMeBot indisponible,
> la commande est créée normalement (seul un log d'erreur est écrit).

---

## 9. Guide d'utilisation admin (premiers pas)

1. **Créer le mot de passe admin** : le hash est un SHA-256 du mot de passe en clair.
   ```bash
   # macOS / Linux
   echo -n "MonMotDePasse" | shasum -a 256
   # ou avec Node
   node -e "console.log(require('crypto').createHash('sha256').update('MonMotDePasse').digest('hex'))"
   ```
   Copiez le résultat dans `ADMIN_PASSWORD_HASH`, et définissez `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_JWT_SECRET`.
2. **Se connecter** : rendez-vous sur `https://VOTRE_DOMAINE/admin/login`.
3. **Dashboard** (`/admin`) : CA du jour, commandes, alertes stock, graphique 30 jours.
4. **Opérations** (`/admin/operations`) : commandes à expédier, erreurs transporteur (relance / traitement manuel), export CSV, fiches de livraison imprimables.
5. **Produits** (`/admin/produits`) : créer/éditer un produit (multilingue, prix MAD/EUR, images Cloudinary, variantes, SEO).
6. **Stock** (`/admin/stock`) : ajustement inline, alertes visuelles.
7. **Coupons / Paramètres** : codes promo, méthodes de livraison, etc.

---

## 10. Structure des fichiers

```
.
├── app/
│   ├── [locale]/                 # Pages publiques (i18n) + loading.tsx / error.tsx
│   │   ├── layout.tsx            # Providers, Navbar, Footer, RTL
│   │   ├── page.tsx              # Accueil (+ JSON-LD Organization/WebSite)
│   │   ├── catalogue/            # Catalogue + /[category]
│   │   ├── produit/[slug]/       # Fiche produit (SSG/ISR, OG, JSON-LD)
│   │   ├── panier/  checkout/  compte/  auth/
│   ├── admin/                    # Back-office
│   │   ├── login/                # Connexion admin (hors auth)
│   │   └── (panel)/              # Pages protégées + actions.ts (server actions)
│   ├── api/                      # Routes API (products, orders, checkout, reviews, webhooks…)
│   ├── sitemap.ts  robots.ts     # SEO
│   └── globals.css               # Design system + RTL
├── components/
│   ├── ui/                       # Composants de base (Button, Input, Modal, RouteError…)
│   ├── layout/                   # Navbar, Footer, CartDrawer, SearchModal…
│   ├── home/                     # Sections de la page d'accueil
│   ├── shop/                     # ProductCard, ProductGrid, FilterSidebar
│   ├── product/                  # ProductDetail, ImageGallery, VariantSelector, StockIndicator
│   ├── checkout/                 # CheckoutWizard, OrderSummary, CODForm, StripePayment
│   ├── account/                  # AccountView, OrderDetail
│   └── admin/                    # UI, charts, vues admin
├── lib/
│   ├── prisma.ts                 # Client Prisma
│   ├── order-orchestrator.ts     # Workflow commandes (voir section 11)
│   ├── auth/                     # admin (JWT), client (Supabase), permissions
│   ├── stripe/  supabase/  cloudinary.ts  resend.ts
│   ├── utils/                    # price, shipping, product, seo, order-status…
│   └── validations/              # Schémas Zod
├── store/                        # Zustand (cart, wishlist, ui)
├── messages/                     # fr.json / ar.json / en.json
├── i18n/                         # routing.ts + request.ts
├── prisma/                       # schema.prisma + seed.ts
├── middleware.ts                 # i18n + rate limiting + sessions + garde admin/compte
├── next.config.ts                # Headers de sécurité, images, plugin next-intl
└── vercel.json                   # Framework, région, headers webhooks
```

---

## 11. Workflow commandes automatique

Le cœur de l'automatisation est `lib/order-orchestrator.ts` (`orderOrchestrator.processOrder(orderId)`), déclenché de façon asynchrone après la création d'une commande :

- **COD** → déclenché immédiatement par `POST /api/checkout/cod`.
- **Stripe / international** → déclenché par `POST /api/orders` (puis paiement via Stripe Elements).

Étapes exécutées par `processOrder` :

1. **Vérification du stock** de chaque article. En cas d'insuffisance → alerte admin par email et arrêt.
2. **Réservation du stock** (décrément `stock`, incrément `salesCount`).
3. **Email de confirmation** au client (Resend).
4. **Création de l'expédition** via le `DeliveryProvider` **actif** (choisi dans Admin → Paramètres → Livraison ; voir section 12). Sans clé valide, repli automatique sur `ManualDeliveryProvider` qui génère un numéro de suivi local.
5. **Mise à jour de la commande** : `trackingNumber`, `carrier`, statut `PROCESSING`.
6. **Historique de statut** (`orderStatusHistory`).
7. **Email « en préparation »** avec le numéro de suivi.

**Gestion d'erreur** : toute exception déclenche un **rollback du stock**, l'enregistrement du `deliveryError` sur la commande, et une **alerte admin** par email. Ces commandes apparaissent dans `/admin/operations` (section « Erreurs transporteur ») où elles peuvent être relancées ou traitées manuellement.

---

## 12. Connecter un vrai transporteur

L'architecture de livraison est **générique et extensible** : tout transporteur implémente l'interface `DeliveryProvider` (`lib/delivery/types.ts`) avec trois méthodes — `createShipment`, `getTracking`, `cancelShipment`.

### Providers fournis

| Provider | Fichier | État |
|---|---|---|
| Manuel | `lib/delivery/providers/manual.ts` | Opérationnel (génère une fiche + numéro de suivi local). |
| Amana | `lib/delivery/providers/amana.ts` | **Stub prêt à connecter.** Sans clé → repli manuel automatique. |
| CTM | `lib/delivery/providers/ctm.ts` | **Stub prêt à connecter.** Sans clé → repli manuel automatique. |

Le transporteur actif et ses clés se gèrent dans **Admin → Paramètres → Livraison**. Les clés sont **chiffrées (AES-256-GCM)** en base et **jamais réaffichées** après saisie. Sans clé valide, le provider choisi **bascule automatiquement sur le mode manuel** : aucune commande n'est jamais bloquée.

### Étapes pour brancher un transporteur réel

1. **Obtenir un compte pro / API** auprès du transporteur (voir contacts ci-dessous).
2. Récupérer auprès de leur **service commercial / intégration** :
   - l'**URL de base de l'API** (endpoints `création d'expédition`, `suivi`, `annulation`) ;
   - le **mode d'authentification** (clé API, token OAuth, identifiants) ;
   - le **format de payload** attendu (champs destinataire, COD/contre-remboursement, poids, ville…) ;
   - la **documentation technique** (souvent un PDF ou un portail développeur) ;
   - les **éventuels frais** et le **contrat de volume**.
3. Implémenter les appels HTTP réels dans le `TODO` du provider correspondant (`createShipment`, `getTracking`, `cancelShipment`).
4. Saisir la clé dans **Admin → Paramètres → Livraison** (ou via `AMANA_API_KEY` / `CTM_API_KEY` en variable d'environnement) et sélectionner le transporteur actif.
5. Tester une commande de bout en bout (le repli manuel reste le filet de sécurité).

### Où trouver les docs / contacts

- **Amana (Poste Maroc / Barid Al-Maghrib)** — service Amana Express. Documentation API non publique : à demander au **service commercial entreprises** de Poste Maroc (`poste.ma`). Demander l'« API d'intégration e-commerce / web service Amana ».
- **CTM Messagerie** — filiale colis de la CTM (`ctm.ma`, section *CTM Messagerie*). API réservée aux comptes pro : contacter leur **service commercial / partenariats e-commerce**.
- **Aramex Maroc** — API publique et bien documentée (`developer.aramex.com`), pratique si tu veux du tracking standardisé.
- **Agrégateurs** (recommandé pour démarrer sans intégrer chaque transporteur) : **Sendcloud**, **Speedaf**, **Chronodiali**, **Sendit.ma** — une seule API pour plusieurs transporteurs marocains, avec impression d'étiquettes et suivi unifié.

> **Conseil** : commence par un **agrégateur** (intégration unique, étiquettes + tracking prêts à l'emploi), puis passe à une intégration directe Amana/CTM si les volumes justifient de négocier des tarifs au transporteur.

---

## Scripts utiles

```bash
npm run dev      # Développement (Turbopack)
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # ESLint
npx tsc --noEmit # Vérification TypeScript
```
