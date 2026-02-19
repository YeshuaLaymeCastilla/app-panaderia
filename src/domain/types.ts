export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;

  image?: string;        // para imágenes en /public/products (opcionales)
  imageDataUrl?: string; // para fotos tomadas/subidas (Admin)
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderLine {
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  total: number;
  paidAtISO: string;
  lines: OrderLine[];
}

export interface Category {
  key: string;  // normalizada en minúsculas (para evitar duplicados)
  name: string; // bonita: "Dulces"
}
