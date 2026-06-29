import { getTranslations } from 'next-intl/server'
import { BrandLoader } from '@/components/ui/BrandLoader'

export default async function Loading() {
  const t = await getTranslations('Common')
  return <BrandLoader label={t('loading')} />
}
