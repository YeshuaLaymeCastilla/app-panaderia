import { useEffect, useMemo, useState } from "react";
import defaultProductsRaw from "../data/products.json";
import type { CartItem, Category, Order, OrderLine, Product } from "../domain/types";
import { addToCart, removeFromCart, totalOf, clearCart } from "../domain/cart";
import { categoryKey, prettyCategoryName } from "../domain/normalize";
import { capitalizeFirst } from "../domain/text";
import { idb } from "../domain/idb";

type Screen = "welcome" | "order" | "checkout" | "endday";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer la imagen"));
    r.readAsDataURL(file);
  });
}

export function useKioskStore() {
  const defaultProducts = defaultProductsRaw as Product[];

  const [screen, setScreen] = useState<Screen>("welcome");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [dayStartISO, setDayStartISO] = useState<string | null>(null);
  const [dayEndISO, setDayEndISO] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [query, setQuery] = useState("");

  const [yapeQrDataUrl, setYapeQrDataUrl] = useState<string | null>(null);

  // -------- CARGA INICIAL --------
  useEffect(() => {
    (async () => {
      const start = await idb.getDay("start");
      const end = await idb.getDay("end");
      const ord = await idb.getOrders();

      setDayStartISO(start);
      setDayEndISO(end);
      setOrders(ord);

      // productos
      const dbProducts = await idb.getProducts();
      const base = dbProducts.length ? dbProducts : defaultProducts;

      if (!dbProducts.length) await idb.setProducts(base);

      setProducts(base);

      // categorías
      const dbCats = await idb.getCategories();
      if (!dbCats.length) {
        const derived = deriveCategories(base);
        for (const c of derived) await idb.upsertCategory(c);
        setCategories(derived);
      } else {
        setCategories(dbCats);
      }

      // QR Yape
      const qr = await idb.getSetting("yape_qr");
      setYapeQrDataUrl(qr);
    })();
  }, []);

  const total = useMemo(() => totalOf(cart), [cart]);

  const categoryNames = useMemo(() => ["Todos", ...categories.map((c) => c.name)], [categories]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "Todos")
      list = list.filter((p) => p.category === selectedCategory);

    const q = query.trim().toLowerCase();
    if (q.length >= 3)
      list = list.filter((p) =>
        (`${p.name} ${p.category}`).toLowerCase().includes(q)
      );

    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory, query]);

  // -------- CARRITO --------
  function addProductToCart(p: Product) {
    setCart((prev) => addToCart(prev, p));
  }

  function addById(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCart((prev) => addToCart(prev, p));
  }

  function removeById(id: string) {
    setCart((prev) => removeFromCart(prev, id));
  }

  function clearCartNow() {
    setCart(clearCart());
  }

  // -------- DÍA --------
  async function startDay() {
    const now = new Date().toISOString();

    setDayStartISO(now);
    setDayEndISO(null);
    setOrders([]);
    setCart([]);

    await idb.clearOrders();
    await idb.clearDay();
    await idb.setDay("start", now);

    setScreen("order");
  }

  async function confirmPaid() {
    if (total <= 0) return;

    const now = new Date().toISOString();

    const lines: OrderLine[] = cart.map((c) => ({
      productId: c.product.id,
      name: c.product.name,
      category: c.product.category,
      unitPrice: c.product.price,
      quantity: c.quantity,
      subtotal: c.quantity * c.product.price,
    }));

    const order: Order = {
      id: makeId(),
      total,
      paidAtISO: now,
      lines,
    };

    await idb.addOrder(order);
    setOrders(await idb.getOrders());

    setCart([]);
    setScreen("order");
  }

  async function endDay() {
    const now = new Date().toISOString();
    setDayEndISO(now);
    await idb.setDay("end", now);
    setScreen("endday");
  }

  async function closeApp() {
    setScreen("welcome");
    setCart([]);
    setDayStartISO(null);
    setDayEndISO(null);
    setOrders([]);

    await idb.clearOrders();
    await idb.clearDay();
  }

  // -------- CATEGORÍAS --------
  type CreateCategoryResult =
    | { ok: true; category: Category }
    | { ok: false; reason: "empty" | "exists"; existingName?: string };

  async function createCategory(raw: string): Promise<CreateCategoryResult> {
    const name = prettyCategoryName(raw);
    const key = categoryKey(raw);

    if (!name || !key) return { ok: false, reason: "empty" };

    const exists = categories.find((c) => c.key === key);
    if (exists) return { ok: false, reason: "exists", existingName: exists.name };

    const cat: Category = { key, name };
    await idb.upsertCategory(cat);

    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));

    return { ok: true, category: cat };
  }

  async function deleteCategory(key: string) {
    const cat = categories.find((c) => c.key === key);
    if (!cat) return;

    const hasProducts = products.some((p) => p.category === cat.name);
    if (hasProducts) return;

    await idb.deleteCategory(key);

    const next = categories.filter((c) => c.key !== key);
    setCategories(next);

    if (selectedCategory === cat.name) setSelectedCategory("Todos");
  }

  // -------- PRODUCTOS --------
  async function addNewProduct(payload: { name: string; price: number; categoryName: string; file?: File | null }) {
    const p: Product = {
      id: makeId(),
      name: capitalizeFirst(payload.name),
      price: payload.price,
      category: prettyCategoryName(payload.categoryName) || "Otros",
    };

    if (payload.file) p.imageDataUrl = await readFileAsDataURL(payload.file);

    await idb.upsertProduct(p);
    setProducts(await idb.getProducts());
  }

  async function updateExistingProduct(payload: {
    id: string;
    name: string;
    price: number;
    categoryName: string;
    file?: File | null;
    keepExistingImage: boolean;
  }) {
    const current = products.find((x) => x.id === payload.id);
    if (!current) return;

    const updated: Product = {
      ...current,
      name: capitalizeFirst(payload.name),
      price: payload.price,
      category: prettyCategoryName(payload.categoryName) || "Otros",
    };

    if (!payload.keepExistingImage) {
      updated.image = undefined;
      updated.imageDataUrl = undefined;
    }

    if (payload.file) {
      updated.imageDataUrl = await readFileAsDataURL(payload.file);
    }

    await idb.upsertProduct(updated);
    setProducts(await idb.getProducts());
  }

  async function deleteProduct(id: string) {
    await idb.deleteProduct(id);
    setProducts(await idb.getProducts());
    setCart((c) => c.filter((x) => x.product.id !== id));
  }

  // -------- QR YAPE --------
  async function setYapeQrFromFile(file: File) {
    const data = await readFileAsDataURL(file);
    await idb.setSetting("yape_qr", data);
    setYapeQrDataUrl(data);
  }

  return {
    screen,
    setScreen,

    cart,
    total,

    dayStartISO,
    dayEndISO,
    orders,

    products,
    filteredProducts,

    categories,
    categoryNames,

    selectedCategory,
    setSelectedCategory,

    query,
    setQuery,

    addProductToCart,
    addById,
    removeById,
    clearCartNow,

    startDay,
    confirmPaid,
    endDay,
    closeApp,

    createCategory,
    deleteCategory,

    addNewProduct,
    updateExistingProduct,
    deleteProduct,

    yapeQrDataUrl,
    setYapeQrFromFile,
  };
}

// -------- HELPERS --------

function deriveCategories(products: Product[]): Category[] {
  const map = new Map<string, Category>();

  for (const p of products) {
    const key = categoryKey(p.category);
    const name = prettyCategoryName(p.category);
    if (!map.has(key)) map.set(key, { key, name });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
