import { formatPEN } from "../../domain/cart";

export default function CheckoutScreen({
  total,
  onBack,
  onConfirmPaid,
}: {
  total: number;
  onBack: () => void;
  onConfirmPaid: () => void;
}) {
  return (
    <div className="checkout">
      <div className="checkoutCard">
        <div className="checkoutTop">
          <h1 className="checkoutTitle">Cobrar</h1>
          <button className="btnSecondary" onClick={onBack}>
            Volver
          </button>
        </div>

        <div className="checkoutTotalBox">
          <div className="checkoutTotalLabel">TOTAL</div>
          <div className="checkoutTotal">{formatPEN(total)}</div>
        </div>

        <div className="checkoutQrBox">
          <div className="checkoutHint">Escanea con Yape y muestra el pago al vendedor</div>
          <img className="qrImg" src="/pay/yape-qr.png" alt="QR Yape" />
        </div>

        <button className="btnPrimary" onClick={onConfirmPaid}>
          CONFIRMAR PAGO (nuevo pedido)
        </button>
      </div>
    </div>
  );
}
