'use client'

// La carte produit canonique vit dans components/product/ProductCard.
// Ce module ré-exporte l'implémentation sous le chemin "shop/" attendu.
export { ProductCard, default, type ProductCardProps } from '@/components/product/ProductCard'
