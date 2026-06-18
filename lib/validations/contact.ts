import { z } from 'zod'

export const CONTACT_SUBJECTS = ['product', 'order', 'partnership', 'other'] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const ContactSchema = z.object({
  name: z.string().trim().min(1, 'errorName').max(120),
  email: z.string().trim().email('errorEmail').max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  subject: z.enum(CONTACT_SUBJECTS, { message: 'errorSubject' }),
  message: z.string().trim().min(10, 'errorMessage').max(5000),
})

export type ContactFormValues = z.infer<typeof ContactSchema>
