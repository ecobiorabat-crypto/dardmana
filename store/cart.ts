import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { trackAddToCart } from '@/lib/analytics/events'

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  image: string
  priceMad: number
  quantity: number
}

/** Code promo appliqué dans le panier, transmis ensuite au checkout. */
export interface AppliedPromo {
  code: string
  discount: number
  message: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  appliedPromo: AppliedPromo | null

  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  setPromo: (promo: AppliedPromo) => void
  clearPromo: () => void

  getItemById: (productId: string, variantId?: string) => CartItem | undefined
  getTotalMad: () => number
  getItemCount: () => number
}

function itemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}__${variantId}` : productId
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedPromo: null,

      addItem: (incoming) => {
        trackAddToCart(
          { id: incoming.productId, name: incoming.name, price: incoming.priceMad },
          incoming.quantity,
        )
        set((state) => {
          const key = itemKey(incoming.productId, incoming.variantId)
          const existing = state.items.find(
            (i) => itemKey(i.productId, i.variantId) === key
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: i.quantity + incoming.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, incoming] }
        })
      },

      removeItem: (productId, variantId) => {
        const key = itemKey(productId, variantId)
        set((state) => ({
          items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
        }))
      },

      updateQuantity: (productId, quantity, variantId) => {
        const key = itemKey(productId, variantId)
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
          }))
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.productId, i.variantId) === key ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], appliedPromo: null }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setPromo: (promo) => set({ appliedPromo: promo }),
      clearPromo: () => set({ appliedPromo: null }),

      getItemById: (productId, variantId) => {
        const key = itemKey(productId, variantId)
        return get().items.find((i) => itemKey(i.productId, i.variantId) === key)
      },

      getTotalMad: () =>
        get().items.reduce((sum, i) => sum + i.priceMad * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'dar-dmana-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, appliedPromo: state.appliedPromo }),
    }
  )
)
