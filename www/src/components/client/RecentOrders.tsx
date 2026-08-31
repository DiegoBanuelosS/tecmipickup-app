import { useState } from "react";
import Image from "next/image";
import type { ActiveOrder } from "@lib/order";
import { formatMxn, getMenuItem } from "@lib/data/menu";
import { FoodIcon } from "./home/FoodIcons";
import styles from "./RecentOrders.module.css";

type RecentOrdersProps = {
  orders: ActiveOrder[];
  defaultOpen?: boolean;
  onReorder: (order: ActiveOrder) => void;
};

const PREVIEW_CAP = 3;

function countItems(order: ActiveOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function formatWhen(placedAt: number) {
  const elapsed = Date.now() - placedAt;

  if (elapsed < 60_000) {
    return "Hace un momento";
  }

  if (elapsed < 3_600_000) {
    return `Hace ${Math.floor(elapsed / 60_000)} min`;
  }

  if (elapsed < 86_400_000) {
    return `Hace ${Math.floor(elapsed / 3_600_000)} h`;
  }

  return new Date(placedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function ItemPreview({ slug, className }: { slug: string; className?: string }) {
  const item = getMenuItem(slug);

  if (item?.image) {
    return <Image src={item.image} alt="" fill sizes="72px" className={className} />;
  }

  if (item) {
    return <FoodIcon glyph={item.glyph} className={styles.previewIcon} />;
  }

  return null;
}

export default function RecentOrders({ orders, defaultOpen = false, onReorder }: RecentOrdersProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (orders.length === 0) {
    return null;
  }

  return (
    <details className={styles.panel} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className={styles.summary}>
        <span className={styles.summaryCopy}>
          <h2 className={styles.title}>Pedidos recientes</h2>
          <span className={styles.count}>
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </span>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>

      <ul className={styles.list}>
        {orders.map((order) => {
          const items = countItems(order);
          const extra = Math.max(0, order.lines.length - PREVIEW_CAP);

          return (
            <li key={order.id} className={styles.order}>
              <details>
                <summary className={styles.orderSummary}>
                  <span className={styles.thumbs} aria-hidden="true">
                    {order.lines.slice(0, PREVIEW_CAP).map((line, index) => (
                      <span key={line.id} className={styles.thumb} style={{ zIndex: PREVIEW_CAP - index }}>
                        <ItemPreview slug={line.slug} className={styles.thumbImg} />
                      </span>
                    ))}
                    {extra > 0 ? <span className={styles.more}>+{extra}</span> : null}
                  </span>
                  <span className={styles.orderCopy}>
                    <span className={styles.orderTitle}>
                      {items} {items === 1 ? "artículo" : "artículos"} · {formatMxn(order.total)}
                    </span>
                    <span className={styles.orderMeta}>{formatWhen(order.placedAt)}</span>
                  </span>
                  <span className={styles.chevron} aria-hidden="true" />
                </summary>

                <ul className={styles.lines}>
                  {order.lines.map((line) => (
                    <li key={line.id} className={styles.line}>
                      <span className={styles.linePreview}>
                        <ItemPreview slug={line.slug} className={styles.lineImg} />
                      </span>
                      <span className={styles.lineCopy}>
                        <span>
                          {line.quantity}× {line.name}
                        </span>
                        {line.labels.length > 0 ? <small>{line.labels.join(" · ")}</small> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>

              <button type="button" className={styles.reorder} onClick={() => onReorder(order)}>
                Volver a pedir
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
