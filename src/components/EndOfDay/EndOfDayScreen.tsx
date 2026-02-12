import type { Order } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

function fmtLocal(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function EndOfDayScreen({
  startISO,
  endISO,
  orders,
  onCloseApp,
}: {
  startISO: string | null;
  endISO: string | null;
  orders: Order[];
  onCloseApp: () => void;
}) {
  const totalDay = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="endday">
      <div className="enddayCard">
        <div className="enddayTop">
          <h1 className="enddayTitle">Resumen del día</h1>
          <button className="btnCloseApp" onClick={onCloseApp}>
            CERRAR APP
          </button>
        </div>

        <div className="enddayInfo">
          <div><b>Inicio de día:</b> {fmtLocal(startISO)}</div>
          <div><b>Fin de día:</b> {fmtLocal(endISO)}</div>
          <div><b>Pedidos cobrados:</b> {orders.length}</div>
        </div>

        <div className="enddayTotal">
          <div className="enddayTotalLabel">GANANCIA TOTAL</div>
          <div className="enddayTotalValue">{formatPEN(totalDay)}</div>
        </div>

        <div className="enddayList">
          {orders.length === 0 ? (
            <div className="empty">No se registraron cobros.</div>
          ) : (
            orders
              .slice()
              .reverse()
              .map((o, idx) => (
                <div className="orderRow" key={o.id}>
                  <div className="orderLeft">
                    <div className="orderTitle">Pedido #{orders.length - idx}</div>
                    <div className="orderMeta">{new Date(o.paidAtISO).toLocaleString()}</div>
                  </div>
                  <div className="orderAmount">{formatPEN(o.total)}</div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
