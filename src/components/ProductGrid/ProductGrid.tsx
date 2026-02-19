import type { Product } from "../../domain/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  onProductClick,
  isEditMode,
}: {
  products: Product[];
  onProductClick: (p: Product) => void;
  isEditMode: boolean;
}) {
  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onClick={onProductClick} isEditMode={isEditMode} />
      ))}
    </div>
  );
}
