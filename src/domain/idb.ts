import type { Category, Order, Product } from "./types";

const DB_NAME = "kiosk_app_db";
const DB_VERSION = 2;

const STORE_PRODUCTS = "products";
const STORE_CATEGORIES = "categories";
const STORE_ORDERS = "orders";
const STORE_DAY = "day"; // { key: "start"|"end", value: string }
const STORE_SETTINGS = "settings"; // { key: string, value: string }

type DayRow = { key: "start" | "end"; value: string };
type SettingRow = { key: string; value: string };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        db.createObjectStore(STORE_ORDERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_DAY)) {
        db.createObjectStore(STORE_DAY, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (os: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const os = t.objectStore(store);
    const req = fn(os);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return tx<T[]>(db, store, "readonly", (os) => os.getAll() as IDBRequest<T[]>);
}

export const idb = {
  // ---------- Products ----------
  async getProducts(): Promise<Product[]> {
    const db = await openDB();
    return txAll<Product>(db, STORE_PRODUCTS);
  },

  async setProducts(products: Product[]) {
    const db = await openDB();
    const t = db.transaction(STORE_PRODUCTS, "readwrite");
    const os = t.objectStore(STORE_PRODUCTS);

    await new Promise<void>((resolve, reject) => {
      products.forEach((p) => os.put(p));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  },

  async upsertProduct(p: Product) {
    const db = await openDB();
    await tx(db, STORE_PRODUCTS, "readwrite", (os) => os.put(p));
  },

  async deleteProduct(id: string) {
    const db = await openDB();
    await tx(db, STORE_PRODUCTS, "readwrite", (os) => os.delete(id));
  },

  // ---------- Categories ----------
  async getCategories(): Promise<Category[]> {
    const db = await openDB();
    return txAll<Category>(db, STORE_CATEGORIES);
  },

  async upsertCategory(c: Category) {
    const db = await openDB();
    await tx(db, STORE_CATEGORIES, "readwrite", (os) => os.put(c));
  },

  async deleteCategory(key: string) {
    const db = await openDB();
    await tx(db, STORE_CATEGORIES, "readwrite", (os) => os.delete(key));
  },

  // ---------- Orders ----------
  async getOrders(): Promise<Order[]> {
    const db = await openDB();
    return txAll<Order>(db, STORE_ORDERS);
  },

  async addOrder(order: Order) {
    const db = await openDB();
    await tx(db, STORE_ORDERS, "readwrite", (os) => os.put(order));
  },

  async clearOrders() {
    const db = await openDB();
    await tx(db, STORE_ORDERS, "readwrite", (os) => os.clear());
  },

  // ---------- Day ----------
  async getDay(key: "start" | "end"): Promise<string | null> {
    const db = await openDB();
    const row = await tx<DayRow | undefined>(
      db,
      STORE_DAY,
      "readonly",
      (os) => os.get(key) as IDBRequest<DayRow | undefined>
    );
    return row?.value ?? null;
  },

  async setDay(key: "start" | "end", value: string) {
    const db = await openDB();
    await tx(db, STORE_DAY, "readwrite", (os) => os.put({ key, value } as DayRow));
  },

  async clearDay() {
    const db = await openDB();
    await tx(db, STORE_DAY, "readwrite", (os) => os.clear());
  },

  // ---------- Settings (QR etc.) ----------
  async getSetting(key: string): Promise<string | null> {
    const db = await openDB();
    const row = await tx<SettingRow | undefined>(
      db,
      STORE_SETTINGS,
      "readonly",
      (os) => os.get(key) as IDBRequest<SettingRow | undefined>
    );
    return row?.value ?? null;
  },

  async setSetting(key: string, value: string) {
    const db = await openDB();
    await tx(db, STORE_SETTINGS, "readwrite", (os) => os.put({ key, value } as SettingRow));
  },
};
