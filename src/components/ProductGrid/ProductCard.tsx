import type { Product } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

function getImgSrc(p: Product) {
  if (p.imageDataUrl) return p.imageDataUrl;
  if (p.image) return `/products/${p.image}`;
  return "";
}

export default function ProductCard({
  product,
  onClick,
  isEditMode,
}: {
  product: Product;
  onClick: (p: Product) => void;
  isEditMode: boolean;
}) {
  const src = getImgSrc(product);

  return (
    <button className={`card ${isEditMode ? "cardEdit" : ""}`} onClick={() => onClick(product)}>
      <img
        className="cardImg"
        src={src}
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
        <div className="cardMetaRow">
          <div className="badge">{product.category}</div>
          <div className="cardPrice">{formatPEN(product.price)}</div>
        </div>
      </div>
    </button>
  );
}
