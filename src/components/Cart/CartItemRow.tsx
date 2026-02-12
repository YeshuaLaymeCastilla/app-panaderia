import type { CartItem } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

export default function CartItemRow({
  item,
  onAdd,
  onRemove,
}: {
  item: CartItem;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const subtotal = item.product.price * item.quantity;

  return (
    <div className="cartRow">
      <div className="cartInfo">
        <div className="cartName">{item.product.name}</div>
        <div className="cartMeta">
          {formatPEN(item.product.price)} c/u · Subtotal: {formatPEN(subtotal)}
        </div>
      </div>

      <div className="qty">
        <button className="qtyBtn" onClick={onRemove}>
          −
        </button>
        <div className="qtyNum">{item.quantity}</div>
        <button className="qtyBtn" onClick={onAdd}>
          +
        </button>
      </div>
    </div>
  );
}
