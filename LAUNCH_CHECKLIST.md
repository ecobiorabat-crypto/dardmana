# Checklist pré-lancement — Dar Dmana

À valider dans l'ordre avant la mise en production.

## Infrastructure & configuration

- [ ] Variables d'environnement configurées sur Vercel (Production + Preview)
- [ ] Base de données Supabase créée + migrations appliquées (`npx prisma migrate deploy`)
- [ ] `NEXT_PUBLIC_APP_URL` pointe sur le domaine de production
- [ ] Stripe webhook configuré (URL `/api/webhooks/stripe` + events `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`)
- [ ] WhatsApp Business API configurée (webhook vérifié + abonnement `messages`)
- [ ] Admin créé (email + `ADMIN_PASSWORD_HASH` + `ADMIN_JWT_SECRET`)

## Contenu

- [ ] Produits importés avec images (Cloudinary)
- [ ] Catégories créées et actives
- [ ] Méthodes de livraison et coupons configurés dans `/admin/parametres`

## Tests de bout en bout

- [ ] Test commande COD end-to-end (création → email → fiche livraison)
- [ ] Test commande Stripe end-to-end (paiement → webhook → statut payé)
- [ ] Test workflow WhatsApp (réception d'un message entrant)
- [ ] Test multilingue FR / AR (RTL) / EN
- [ ] Test orchestrateur : rollback stock + alerte admin sur erreur

## SEO & Analytics

- [ ] SEO : sitemap accessible sur `/sitemap.xml`
- [ ] SEO : `/robots.txt` accessible et bloque `/admin/`
- [ ] SEO : Open Graph / JSON-LD valides (test via Rich Results Test)
- [ ] Analytics : vérifier que les events se trackent

## Qualité & sécurité

- [ ] `npm run build` réussit
- [ ] `npx tsc --noEmit` sans erreur
- [ ] `npm run lint` sans erreur
- [ ] Headers de sécurité présents (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] Secrets non exposés (aucune clé `*_SECRET` / service role côté client)
