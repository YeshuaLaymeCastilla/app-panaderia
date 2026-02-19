import { useEffect, useMemo, useState } from "react";
import defaultProductsRaw from "../data/products.json";
import type { CartItem, Category, Order, OrderLine, Product } from "../domain/types";
import { addToCart, removeFromCart, totalOf, clearCart } from "../domain/cart";
import { categoryKey, prettyCategoryName } from "../domain/normalize";
import { idb } from "../domain/idb";
import { capitalizeFirst } from "../domain/text";

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

  // filtros
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");

  // carga inicial
  useEffect(() => {
    (async () => {
      // Día / orders
      const start = await idb.getDay("start");
      const end = await idb.getDay("end");
      const ord = await idb.getOrders();

      setDayStartISO(start);
      setDayEndISO(end);
      setOrders(ord);

      if (start && !end) setScreen("order");
      if (start && end) setScreen("endday");

      // Productos
      const dbProducts = await idb.getProducts();
      const hasAny = dbProducts.length > 0;

      const base = hasAny ? dbProducts : defaultProducts;

      // Si DB estaba vacía, inicializamos con defaults
      if (!hasAny) await idb.setProducts(base);

      setProducts(base);

      // Categorías: si DB está vacía, las derivamos de productos
      const dbCats = await idb.getCategories();
      if (dbCats.length === 0) {
        const fromProducts = deriveCategories(base);
        for (const c of fromProducts) await idb.upsertCategory(c);
        setCategories(fromProducts);
      } else {
        setCategories(sortCats(dbCats));
      }
    })();
  }, []);

  const total = useMemo(() => totalOf(cart), [cart]);

  const categoryNames = useMemo(() => {
    const names = ["Todos", ...categories.map((c) => c.name)];
    return names;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "Todos") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    const q = query.trim().toLowerCase();
    if (q.length >= 3) {
      list = list.filter((p) => (`${p.name} ${p.category}`).toLowerCase().includes(q));
    }

    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory, query]);

  // carrito
  function addProductToCart(p: Product) {
    setCart((prev) => addToCart(prev, p));
  }
  function addById(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCart((prev) => addToCart(prev, p));
  }
  function removeById(productId: string) {
    setCart((prev) => removeFromCart(prev, productId));
  }
  function clearCartNow() {
    setCart(clearCart());
  }

  // día
  async function startDay() {
    const now = new Date().toISOString();
    setDayStartISO(now);
    setDayEndISO(null);
    setOrders([]);
    await idb.setDay("start", now);
    await idb.clearOrders();
    await idb.setDay("end", ""); // lo limpiamos luego abajo
    await idb.clearDay();        // mejor: limpia y setea start
    await idb.setDay("start", now);
    setScreen("order");
    setCart(clearCart());
  }

  async function confirmPaid() {
    if (total <= 0) return;
    const nowISO = new Date().toISOString();

    const lines: OrderLine[] = cart.map((ci) => ({
      productId: ci.product.id,
      name: ci.product.name,
      category: ci.product.category,
      unitPrice: ci.product.price,
      quantity: ci.quantity,
      subtotal: ci.quantity * ci.product.price,
    }));

    const order: Order = { id: makeId(), total, paidAtISO: nowISO, lines };

    await idb.addOrder(order);
    const next = await idb.getOrders();
    setOrders(next);

    setCart(clearCart());
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
    setCart(clearCart());
    setDayStartISO(null);
    setDayEndISO(null);
    setOrders([]);
    await idb.clearOrders();
    await idb.clearDay();
  }

  // categorías
  async function createCategory(rawName: string): Promise<{ ok: true; category: Category } | { ok: false; reason: "exists" | "empty"; existingName?: string }> {
    const pretty = prettyCategoryName(rawName);
    const key = categoryKey(rawName);

    if (!pretty || !key) return { ok: false, reason: "empty" };

    const exists = categories.find((c) => c.key === key);
    if (exists) return { ok: false, reason: "exists", existingName: exists.name };

    const cat: Category = { key, name: pretty };
    await idb.upsertCategory(cat);

    const next = sortCats([...categories, cat]);
    setCategories(next);

    // si usuario estaba en "Todos", nada. Si estaba en categoría inexistente, no aplica.
    return { ok: true, category: cat };
  }

  // productos (admin)
  async function addNewProduct(payload: { name: string; price: number; categoryName: string; file?: File | null }) {
    const p: Product = {
      id: makeId(),
      name: capitalizeFirst(payload.name),
      price: payload.price,
      category: payload.categoryName,
    };

    if (payload.file) {
      p.imageDataUrl = await readFileAsDataURL(payload.file);
    }

    await idb.upsertProduct(p);
    const next = (await idb.getProducts()).sort((a, b) => a.name.localeCompare(b.name));
    setProducts(next);
  }

  async function updateExistingProduct(payload: { id: string; name: string; price: number; categoryName: string; file?: File | null; keepExistingImage: boolean }) {
    const current = products.find((x) => x.id === payload.id);
    if (!current) return;

    const updated: Product = {
      ...current,
      name: capitalizeFirst(payload.name),
      price: payload.price,
      category: payload.categoryName,
    };

    if (!payload.keepExistingImage) {
      updated.image = undefined;
      updated.imageDataUrl = undefined;
    }
    if (payload.file) {
      updated.image = undefined;
      updated.imageDataUrl = await readFileAsDataURL(payload.file);
    }

    await idb.upsertProduct(updated);
    const next = (await idb.getProducts()).sort((a, b) => a.name.localeCompare(b.name));
    setProducts(next);
  }

  async function deleteProduct(id: string) {
    await idb.deleteProduct(id);
    setCart((prev) => prev.filter((c) => c.product.id !== id));
    const next = (await idb.getProducts()).sort((a, b) => a.name.localeCompare(b.name));
    setProducts(next);
  }

  return {
    // state
    screen, setScreen,
    cart, total,
    dayStartISO, dayEndISO, orders,
    products, filteredProducts,
    categories, categoryNames,
    selectedCategory, setSelectedCategory,
    query, setQuery,

    // actions
    addProductToCart, addById, removeById, clearCartNow,
    startDay, confirmPaid, endDay, closeApp,

    // admin
    createCategory,
    addNewProduct, updateExistingProduct, deleteProduct,
    deleteCategory,
  };

  async function deleteCategory(key: string) {
    const next = categories.filter(c => c.key !== key);
    setCategories(next);

    const db = await (await import("../domain/idb")).idb;
    const all = await db.getCategories();

    for (const c of all) {
      if (c.key === key) {
        const d = indexedDB.open("kiosk_app_db");
        d.onsuccess = () => {
          const tx = d.result.transaction("categories", "readwrite");
          tx.objectStore("categories").delete(key);
        };
      }
    }
  }

}

function deriveCategories(products: Product[]): Category[] {
  const map = new Map<string, Category>();
  for (const p of products) {
    const key = categoryKey(p.category);
    const name = prettyCategoryName(p.category);
    if (key && name && !map.has(key)) map.set(key, { key, name });
  }
  return sortCats(Array.from(map.values()));
}

function sortCats(cats: Category[]) {
  return cats.slice().sort((a, b) => a.name.localeCompare(b.name));
}
