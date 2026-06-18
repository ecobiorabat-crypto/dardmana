import { z } from 'zod'

/**
 * Schéma de création d'une entrée du Livre d'Or (soumission publique).
 * Les champs de modération (isApproved, isFeatured, likesCount, source…) ne
 * sont pas exposés ici : ils sont gérés côté admin / serveur.
 */
export const GuestbookEntrySchema = z.object({
  customerName: z.string().trim().min(2, 'Nom requis').max(80, 'Nom trop long'),
  customerCity: z.string().trim().max(80).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(500, 'Le message ne peut pas dépasser 500 caractères'),
  rating: z.number().int().min(1).max(5).optional(),
  productTag: z.string().trim().max(120).optional().or(z.literal('')),
})

export type GuestbookEntryInput = z.infer<typeof GuestbookEntrySchema>
