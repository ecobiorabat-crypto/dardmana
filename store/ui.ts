import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  message: string
  type: ToastType
  show: boolean
}

interface UiState {
  searchOpen: boolean
  cartOpen: boolean
  wishlistOpen: boolean
  mobileMenuOpen: boolean
  currentLocale: string
  toast: Toast

  setSearchOpen: (open: boolean) => void
  setCartOpen: (open: boolean) => void
  setWishlistOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  toggleSearch: () => void
  toggleCart: () => void
  toggleWishlist: () => void
  toggleMobileMenu: () => void
  closeAll: () => void

  setLocale: (locale: string) => void

  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

export const useUiStore = create<UiState>((set) => ({
  searchOpen: false,
  cartOpen: false,
  wishlistOpen: false,
  mobileMenuOpen: false,
  currentLocale: 'fr',
  toast: { message: '', type: 'info', show: false },

  setSearchOpen: (open) => set({ searchOpen: open }),
  setCartOpen: (open) => set({ cartOpen: open }),
  setWishlistOpen: (open) => set({ wishlistOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  toggleWishlist: () => set((s) => ({ wishlistOpen: !s.wishlistOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

  closeAll: () =>
    set({
      searchOpen: false,
      cartOpen: false,
      wishlistOpen: false,
      mobileMenuOpen: false,
    }),

  setLocale: (locale) => set({ currentLocale: locale }),

  showToast: (message, type = 'info') =>
    set({ toast: { message, type, show: true } }),

  hideToast: () =>
    set((s) => ({ toast: { ...s.toast, show: false } })),
}))
