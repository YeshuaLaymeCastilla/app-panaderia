import type { Product } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

export default function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  return (
    <button className="card" onClick={() => onAdd(product)}>
      <img
        className="cardImg"
        src={`/products/${product.image}`}
        alt={product.name}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
                <rect width="100%" height="100%" fill="#eaeaea"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#777" font-size="24">
                  Sin imagen
                </text>
              </svg>`
            );
        }}
      />
      <div className="cardBody">
        <div className="cardTitle">{product.name}</div>
        <div className="cardPrice">{formatPEN(product.price)}</div>
      </div>
    </button>
  );
}
