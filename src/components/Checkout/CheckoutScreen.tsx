import type { CartItem } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

export default function CheckoutScreen({
  total,
  qrSrc,
  cart = [],
  onBack,
  onConfirmPaid,
}: {
  total: number;
  qrSrc?: string | null;
  cart?: CartItem[];
  onBack: () => void;
  onConfirmPaid: () => void;
}) {
  return (
    <div className="checkout">
      <div className="checkoutCard">
        <div className="checkoutTop">
          <button type="button" className="btnSecondary" onClick={onBack}>
            ← Volver
          </button>

          <div className="checkoutTitle">Cobrar</div>

          <button
            type="button"
            className="btnPrimary"
            onClick={onConfirmPaid}
            disabled={total <= 0}
          >
            Confirmar pago
          </button>
        </div>

        <div className="checkoutBody">
          {/* Izquierda: lista */}
          <div className="checkoutLeft">
            <div className="checkoutSectionTitle">Resumen</div>

            {cart.length === 0 ? (
              <div className="emptyBox">Tu carrito está vacío.</div>
            ) : (
              <div className="checkoutList">
                {cart.map((ci) => (
                  <div key={ci.product.id} className="checkoutLine">
                    <div className="checkoutLineName">
                      {ci.product.name}
                      <span className="checkoutQty">x{ci.quantity}</span>
                    </div>
                    <div className="checkoutLinePrice">
                      {formatPEN(ci.product.price * ci.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="checkoutTotalBox">
              <div className="checkoutTotalLabel">TOTAL</div>
              <div className="checkoutTotalValue">{formatPEN(total)}</div>
            </div>
          </div>

          {/* Derecha: QR */}
          <div className="checkoutRight">
            <div className="checkoutSectionTitle">Yape</div>

            {qrSrc ? (
              <img className="qrBig" src={qrSrc} alt="QR Yape" />
            ) : (
              <div className="emptyBox">
                No hay QR configurado. En Admin (💲) sube tu QR desde galería/archivos.
              </div>
            )}

            <div className="checkoutHint">
              El cliente escanea, paga y luego presiona <b>Confirmar pago</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
