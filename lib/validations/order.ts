import { z } from 'zod'

const MAPhoneRegex = /^(0|\+212)[5-9]\d{8}$/
const InternationalPhoneRegex = /^\+?[1-9]\d{6,14}$/

export const AddressSchema = z.object({
  label: z.string().max(50).default('Domicile'),
  fullName: z.string().min(2, 'Nom complet requis').max(200),
  phone: z.string().regex(InternationalPhoneRegex, 'Numéro de téléphone invalide'),
  addressLine1: z.string().min(5, 'Adresse requise').max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().min(2, 'Ville requise').max(100),
  postalCode: z.string().max(20).optional(),
  region: z.string().max(100).optional(),
  country: z.string().length(2, 'Code pays invalide (ex: MA, FR)').default('MA'),
})

export type AddressFormValues = z.infer<typeof AddressSchema>

export const CheckoutFormSchema = z.object({
  customerName: z.string().min(2, 'Nom requis').max(200),
  customerEmail: z.string().email('Email invalide'),
  customerPhone: z.string().regex(InternationalPhoneRegex, 'Téléphone invalide'),

  shippingAddress: AddressSchema,

  paymentMethod: z.enum(['COD', 'CMI', 'STRIPE', 'PAYPAL'], {
    message: 'Méthode de paiement requise',
  }),

  promoCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),

  saveAddress: z.boolean().default(false),
})

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>

export const CODFormSchema = z.object({
  customerName: z.string().min(2, 'Nom requis').max(200),
  customerPhone: z
    .string()
    .regex(MAPhoneRegex, 'Numéro marocain requis (ex: 0612345678 ou +212612345678)'),
  customerEmail: z.string().email('Email invalide').optional().or(z.literal('')),

  addressLine1: z.string().min(5, 'Adresse requise').max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().min(2, 'Ville requise').max(100),
  postalCode: z.string().max(10).optional(),
  region: z.string().max(100).optional(),

  notes: z.string().max(500).optional(),
})

export type CODFormValues = z.infer<typeof CODFormSchema>

export const OrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(InternationalPhoneRegex),

  shippingAddress: AddressSchema,

  subtotalMad: z.number().positive(),
  shippingCostMad: z.number().min(0).default(0),
  discountMad: z.number().min(0).default(0),
  totalMad: z.number().positive(),

  currency: z.string().length(3).default('MAD'),

  paymentMethod: z.enum(['COD', 'CMI', 'STRIPE', 'PAYPAL']),
  source: z.enum(['SHOP', 'WHATSAPP', 'ADMIN']).default('SHOP'),

  promoCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
})

export type OrderFormValues = z.infer<typeof OrderSchema>

export const PromoCodeApplySchema = z.object({
  code: z.string().min(1, 'Code requis').max(50).toUpperCase(),
  orderTotal: z.number().positive(),
})

export type PromoCodeApplyValues = z.infer<typeof PromoCodeApplySchema>

export const ReviewSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().min(2, 'Nom requis').max(200),
  customerCountry: z.string().length(2).optional(),
  rating: z.number().int().min(1, 'Note minimale : 1').max(5, 'Note maximale : 5'),
  title: z.string().max(200).optional(),
  content: z.string().min(10, 'Avis trop court (10 caractères minimum)').max(2000),
})

export type ReviewFormValues = z.infer<typeof ReviewSchema>
