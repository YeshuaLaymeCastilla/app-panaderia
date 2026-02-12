import type { CartItem } from "../../domain/types";
import { formatPEN } from "../../domain/cart";
import CartItemRow from "./CartItemRow";

export default function CartPanel({
  cart,
  total,
  onAdd,
  onRemove,
  onClear,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="cart">
      <div className="cartHeader">
        <div>
          <div className="cartTitle">Carrito</div>
          <div className="cartSub">{cart.length} ítems</div>
        </div>

        <button className="btnSecondary" onClick={onClear}>
          Vaciar
        </button>
      </div>

      <div className="cartList">
        {cart.length === 0 ? (
          <div className="empty">Selecciona productos para agregarlos.</div>
        ) : (
          cart.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              onAdd={() => onAdd(item.product.id)}
              onRemove={() => onRemove(item.product.id)}
            />
          ))
        )}
      </div>

      <div className="cartFooter">
        <div className="totalRow">
          <div className="totalLabel">Total</div>
          <div className="totalValue">{formatPEN(total)}</div>
        </div>

        <button className="btnPrimary" disabled={total <= 0} onClick={onCheckout}>
          Cobrar
        </button>
      </div>
    </div>
  );
}
