import { useEffect, useMemo, useState } from "react";
import productsRaw from "../data/products.json";
import type { Product, CartItem, Order } from "../domain/types";
import { addToCart, removeFromCart, totalOf, clearCart } from "../domain/cart";

import ProductGrid from "../components/ProductGrid/ProductGrid";
import CartPanel from "../components/Cart/CartPanel";
import CheckoutScreen from "../components/Checkout/CheckoutScreen";
import WelcomeScreen from "../components/Welcome/WelcomeScreen";
import EndOfDayScreen from "../components/EndOfDay/EndOfDayScreen";

type Screen = "welcome" | "order" | "checkout" | "endday";

const LS_START = "panaderia_day_start_iso";
const LS_ORDERS = "panaderia_day_orders";
const LS_END = "panaderia_day_end_iso";

function loadStart(): string | null {
  return localStorage.getItem(LS_START);
}
function loadEnd(): string | null {
  return localStorage.getItem(LS_END);
}
function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ORDERS);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}
function saveOrders(orders: Order[]) {
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
}

export default function App() {
  const products = (productsRaw as Product[]).slice().sort((a, b) => a.name.localeCompare(b.name));


  const [screen, setScreen] = useState<Screen>("welcome");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [dayStartISO, setDayStartISO] = useState<string | null>(null);
  const [dayEndISO, setDayEndISO] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cargar sesión si existe (por si recargas)
  useEffect(() => {
    const start = loadStart();
    const end = loadEnd();
    const ord = loadOrders();

    setDayStartISO(start);
    setDayEndISO(end);
    setOrders(ord);

    // Si hay inicio y NO hay fin, seguimos en modo día iniciado
    if (start && !end) setScreen("order");
    // Si hay fin, mostrar resumen
    if (start && end) setScreen("endday");
  }, []);

  const total = useMemo(() => totalOf(cart), [cart]);

  function handleAdd(product: Product) {
    setCart((prev) => addToCart(prev, product));
  }

  function handleAddById(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCart((prev) => addToCart(prev, p));
  }

  function handleRemove(productId: string) {
    setCart((prev) => removeFromCart(prev, productId));
  }

  function handleClear() {
    setCart(clearCart());
  }

  function startDay() {
    const nowISO = new Date().toISOString(); // fecha/hora exacta (hora, minuto, segundo)
    setDayStartISO(nowISO);
    setDayEndISO(null);
    setOrders([]);
    localStorage.setItem(LS_START, nowISO);
    localStorage.removeItem(LS_END);
    saveOrders([]);
    setCart(clearCart());
    setScreen("order");
  }

  function confirmPaid() {
    if (total <= 0) return;

    const nowISO = new Date().toISOString();
    const newOrder: Order = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      total,
      paidAtISO: nowISO,
    };

    setOrders((prev) => {
      const next = [...prev, newOrder];
      saveOrders(next);
      return next;
    });

    setCart(clearCart());
    setScreen("order");
  }

  function endDay() {
    const nowISO = new Date().toISOString();
    setDayEndISO(nowISO);
    localStorage.setItem(LS_END, nowISO);
    setScreen("endday");
  }

  function closeApp() {
    // vuelve al inicio y borra sesión del día (como “cerrar app”)
    setScreen("welcome");
    setCart(clearCart());
    setDayStartISO(null);
    setDayEndISO(null);
    setOrders([]);
    localStorage.removeItem(LS_START);
    localStorage.removeItem(LS_END);
    localStorage.removeItem(LS_ORDERS);
  }

  if (screen === "welcome") {
    return <WelcomeScreen onStart={startDay} />;
  }

  if (screen === "endday") {
    return (
      <EndOfDayScreen
        startISO={dayStartISO}
        endISO={dayEndISO}
        orders={orders}
        onCloseApp={closeApp}
      />
    );
  }

  if (screen === "checkout") {
    return (
      <CheckoutScreen
        total={total}
        onBack={() => setScreen("order")}
        onConfirmPaid={confirmPaid}
      />
    );
  }

  // ORDER SCREEN
  return (
    <div className="page">
      <div className="topbar">
        <div className="topTitle">App Panadería</div>
      </div>

      <div className="layout">
        <div className="left">
          <h2 className="sectionTitle">Productos</h2>
          <ProductGrid products={products} onAdd={handleAdd} />
        </div>

        <div className="right">
          <CartPanel
            cart={cart}
            total={total}
            onAdd={handleAddById}
            onRemove={handleRemove}
            onClear={handleClear}
            onCheckout={() => setScreen("checkout")}
          />
        </div>
      </div>

      {/* Botón rojo inferior izquierdo (como pediste) */}
      <button className="btnEndDayFloating" onClick={endDay}>
        TERMINAR DÍA
      </button>
    </div>
  );
}
