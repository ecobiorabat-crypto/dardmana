import { z } from 'zod'

export const INVITABLE_ROLES = ['ADMIN', 'MANAGER', 'SUPPORT', 'STOCK', 'FINANCE'] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const OnboardingModeSchema = z.enum(['temp_password', 'invite'])

export const CreateTeamMemberSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(1, 'Nom requis').max(200),
  role: z.enum(INVITABLE_ROLES),
  onboarding: OnboardingModeSchema.default('invite'),
})

export const PatchTeamMemberSchema = z.object({
  role: z.enum(INVITABLE_ROLES).optional(),
  isActive: z.boolean().optional(),
  resetPassword: OnboardingModeSchema.optional(),
})

export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberSchema>
export type PatchTeamMemberInput = z.infer<typeof PatchTeamMemberSchema>
