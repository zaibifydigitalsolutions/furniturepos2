import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  customerId?: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  paymentMethod: 'cash' | 'card' | 'credit';
  amountReceived: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;
  setCustomerId: (customerId?: number) => void;
  setDiscount: (discount: number) => void;
  setDiscountType: (type: 'percentage' | 'fixed') => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'credit') => void;
  setAmountReceived: (amount: number) => void;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
  getChange: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  discountType: 'fixed',
  paymentMethod: 'cash',
  amountReceived: 0,

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.productId === item.productId);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.price - i.discount }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, total: quantity * i.price - i.discount }
          : i
      ),
    }));
  },

  updateItemDiscount: (productId, discount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, discount, total: i.quantity * i.price - discount }
          : i
      ),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      customerId: undefined,
      discount: 0,
      discountType: 'fixed',
      paymentMethod: 'cash',
      amountReceived: 0,
    });
  },

  setCustomerId: (customerId) => set({ customerId }),
  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountReceived: (amountReceived) => set({ amountReceived }),

  getSubtotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getTotalDiscount: () => {
    const state = get();
    // Item discounts (fixed amounts)
    const itemDiscounts = state.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    // Order discount (fixed amount)
    const orderDiscount = Math.min(state.discount, state.getSubtotal() - itemDiscounts);
    return itemDiscounts + orderDiscount;
  },

  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discount = state.getTotalDiscount();
    return subtotal - discount;
  },

  getChange: () => {
    const state = get();
    const total = state.getTotal();
    return Math.max(0, state.amountReceived - total);
  },
}));
