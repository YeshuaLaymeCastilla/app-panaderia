import { useMemo, useState } from "react";
import type { Order } from "../../domain/types";
import { formatPEN } from "../../domain/cart";

function fmtLocal(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function groupByCategory(order: Order) {
  const map = new Map<string, { categoryTotal: number; lines: Order["lines"] }>();
  for (const line of order.lines) {
    const prev = map.get(line.category);
    if (!prev) map.set(line.category, { categoryTotal: line.subtotal, lines: [line] });
    else {
      prev.categoryTotal += line.subtotal;
      prev.lines.push(line);
    }
  }
  return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const totalDay = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

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

        {!selectedOrder ? (
          <div className="enddayList">
            {orders.length === 0 ? (
              <div className="empty">No se registraron cobros.</div>
            ) : (
              orders
                .slice()
                .reverse()
                .map((o, idx) => (
                  <button className="orderRow orderRowBtn" key={o.id} onClick={() => setSelectedOrderId(o.id)}>
                    <div className="orderLeft">
                      <div className="orderTitle">Pedido #{orders.length - idx}</div>
                      <div className="orderMeta">{new Date(o.paidAtISO).toLocaleString()}</div>
                    </div>
                    <div className="orderAmount">{formatPEN(o.total)}</div>
                  </button>
                ))
            )}
          </div>
        ) : (
          <div className="orderDetail">
            <div className="orderDetailTop">
              <button className="btnSecondary" onClick={() => setSelectedOrderId(null)}>
                ← Volver al resumen
              </button>
              <div className="orderDetailTitle">
                <div className="orderTitle">Detalle del pedido</div>
                <div className="orderMeta">{new Date(selectedOrder.paidAtISO).toLocaleString()}</div>
              </div>
              <div className="orderAmount">{formatPEN(selectedOrder.total)}</div>
            </div>

            <div className="orderCats">
              {groupByCategory(selectedOrder).map((g) => (
                <div className="catBlock" key={g.category}>
                  <div className="catHeader">
                    <div className="catName">{g.category}</div>
                    <div className="catTotal">{formatPEN(g.categoryTotal)}</div>
                  </div>

                  <div className="catLines">
                    {g.lines.map((ln) => (
                      <div className="lineRow" key={ln.productId + ln.name}>
                        <div className="lineLeft">
                          <div className="lineName">{ln.name}</div>
                          <div className="lineMeta">
                            {ln.quantity} × {formatPEN(ln.unitPrice)}
                          </div>
                        </div>
                        <div className="lineSubtotal">{formatPEN(ln.subtotal)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
