export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // archivo en /public/products
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  total: number;
  paidAtISO: string; // fecha/hora exacta del cobro
}
