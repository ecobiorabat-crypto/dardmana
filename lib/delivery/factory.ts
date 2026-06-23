import type { DeliveryProvider, DeliveryProviderId } from '@/lib/delivery/types'
import { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'
import { AmanaDeliveryProvider } from '@/lib/delivery/providers/amana'
import { CTMDeliveryProvider } from '@/lib/delivery/providers/ctm'
import { SenditDeliveryProvider } from '@/lib/delivery/providers/sendit'

/** Construit le provider actif avec ses identifiants (issus de l'admin / .env). */
export function createDeliveryProvider(
  active: DeliveryProviderId,
  creds: { amanaApiKey?: string; ctmApiKey?: string; senditApiKey?: string } = {},
): DeliveryProvider {
  switch (active) {
    case 'AMANA':
      return new AmanaDeliveryProvider(creds.amanaApiKey)
    case 'CTM':
      return new CTMDeliveryProvider(creds.ctmApiKey)
    case 'SENDIT':
      return new SenditDeliveryProvider(creds.senditApiKey)
    default:
      return new ManualDeliveryProvider()
  }
}
