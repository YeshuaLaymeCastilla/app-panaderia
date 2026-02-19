import type { Order, Product } from "./types";

const LS_PRODUCTS = "panaderia_products";
const LS_ORDERS = "panaderia_day_orders";
const LS_START = "panaderia_day_start_iso";
const LS_END = "panaderia_day_end_iso";

export function loadProducts(defaultProducts: Product[]): Product[] {
  try {
    const raw = localStorage.getItem(LS_PRODUCTS);
    if (!raw) return defaultProducts;
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ORDERS);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
}

export function loadStart(): string | null {
  return localStorage.getItem(LS_START);
}
export function loadEnd(): string | null {
  return localStorage.getItem(LS_END);
}
export function saveStart(iso: string) {
  localStorage.setItem(LS_START, iso);
}
export function saveEnd(iso: string) {
  localStorage.setItem(LS_END, iso);
}
export function clearDaySession() {
  localStorage.removeItem(LS_START);
  localStorage.removeItem(LS_END);
  localStorage.removeItem(LS_ORDERS);
}
