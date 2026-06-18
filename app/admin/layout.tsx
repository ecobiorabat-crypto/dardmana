import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administration · Dar Dmana',
  robots: { index: false, follow: false },
}

// Layout racine de la section admin : simple passe-plat. La protection d'accès
// et la barre latérale sont gérées dans le groupe (panel), afin que la page
// /admin/login reste accessible sans authentification (sinon boucle de redirection).
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
