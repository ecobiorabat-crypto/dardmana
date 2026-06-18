// Point d'entrée central de la configuration next-intl.
// Le plugin next-intl (next.config.ts) cible ./i18n/request.ts pour la
// résolution par requête ; ce module ré-exporte la config pour un accès unifié.
export { routing, type Locale } from './i18n/routing'
export { default } from './i18n/request'
