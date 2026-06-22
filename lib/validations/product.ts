import { z } from 'zod'

export const CategorySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  nameFr: z.string().min(1, 'Nom FR requis').max(200),
  nameAr: z.string().min(1, 'Nom AR requis').max(200),
  nameEn: z.string().min(1, 'Nom EN requis').max(200),
  descriptionFr: z.string().max(2000).optional(),
  descriptionAr: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  icon: z.string().max(10).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitleFr: z.string().max(70).optional(),
  metaDescriptionFr: z.string().max(160).optional(),
})

export type CategoryFormValues = z.infer<typeof CategorySchema>

export const ProductVariantSchema = z.object({
  nameFr: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  sku: z.string().max(100).optional(),
  priceMad: z.number().positive('Prix requis'),
  stock: z.number().int().min(0),
  attributes: z.record(z.string(), z.string()),
  isActive: z.boolean().default(true),
})

export type ProductVariantFormValues = z.infer<typeof ProductVariantSchema>

export const ProductSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  sku: z.string().max(100).optional(),

  nameFr: z.string().min(1, 'Nom FR requis').max(300),
  nameAr: z.string().min(1, 'Nom AR requis').max(300),
  nameEn: z.string().min(1, 'Nom EN requis').max(300),

  descriptionFr: z.string().min(1, 'Description FR requise'),
  descriptionAr: z.string().min(1, 'Description AR requise'),
  descriptionEn: z.string().min(1, 'Description EN requise'),

  shortDescFr: z.string().max(300).optional(),
  shortDescAr: z.string().max(300).optional(),
  shortDescEn: z.string().max(300).optional(),

  priceMad: z.number().positive('Prix MAD requis'),
  priceEur: z.number().positive().optional(),
  comparePriceMad: z.number().positive().optional(),

  categoryId: z.string().min(1, 'Catégorie requise'),

  images: z.array(z.string().url()).default([]),
  videoUrl: z.string().url().optional().or(z.literal('')),

  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),

  weightG: z.number().int().positive().optional(),
  dimensions: z.string().max(100).optional(),

  materialFr: z.string().max(200).optional(),
  materialAr: z.string().max(200).optional(),
  materialEn: z.string().max(200).optional(),

  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).default('PHYSICAL'),

  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),

  tags: z.array(z.string()).default([]),

  metaTitleFr: z.string().max(70).optional(),
  metaTitleAr: z.string().max(70).optional(),
  metaTitleEn: z.string().max(70).optional(),
  metaDescriptionFr: z.string().max(160).optional(),
  metaDescriptionAr: z.string().max(160).optional(),
  metaDescriptionEn: z.string().max(160).optional(),

  variants: z.array(ProductVariantSchema).default([]),
})

export type ProductFormValues = z.infer<typeof ProductSchema>

export const ProductFilterSchema = z.object({
  categorySlug: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  ids: z.string().max(2000).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(24),
  sortBy: z.enum(['createdAt', 'priceMad', 'ratingAvg', 'salesCount', 'viewsCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ProductFilterValues = z.infer<typeof ProductFilterSchema>
