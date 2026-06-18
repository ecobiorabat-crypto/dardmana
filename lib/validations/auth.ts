import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().default(false),
})

export type LoginFormValues = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nom trop court (2 caractères minimum)')
      .max(200, 'Nom trop long'),
    email: z.string().email('Email invalide'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, 'Numéro de téléphone invalide')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Mot de passe : 8 caractères minimum')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
    preferredLanguage: z.enum(['fr', 'ar', 'en']).default('fr'),
    acceptTerms: z.literal(true, {
      message: 'Vous devez accepter les conditions d\'utilisation',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof RegisterSchema>

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Email invalide'),
})

export type ResetPasswordRequestValues = z.infer<typeof ResetPasswordRequestSchema>

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mot de passe : 8 caractères minimum')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Numéro invalide')
    .optional()
    .or(z.literal('')),
  preferredLanguage: z.enum(['fr', 'ar', 'en']).optional(),
  country: z.string().length(2).optional(),
})

export type UpdateProfileFormValues = z.infer<typeof UpdateProfileSchema>
