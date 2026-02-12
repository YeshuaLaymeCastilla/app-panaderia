import type { CartItem, Product } from "./types";

export function addToCart(cart: CartItem[], product: Product): CartItem[] {
  const idx = cart.findIndex((c) => c.product.id === product.id);
  if (idx >= 0) {
    return cart.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + 1 } : c));
  }
  return [...cart, { product, quantity: 1 }];
}

export function removeFromCart(cart: CartItem[], productId: string): CartItem[] {
  return cart
    .map((c) => (c.product.id === productId ? { ...c, quantity: c.quantity - 1 } : c))
    .filter((c) => c.quantity > 0);
}

export function clearCart(): CartItem[] {
  return [];
}

export function totalOf(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
}

export function formatPEN(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}
