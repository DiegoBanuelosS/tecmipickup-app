import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import ClientShell from "../../components/client/ClientShell";
import RecentOrders from "../../components/client/RecentOrders";
import { FoodIcon } from "../../components/client/home/FoodIcons";
import PayButton from "../../components/client/PayButton";
import { itemPath, routes } from "@config/Router";
import { fetchUserPedidos } from "@lib/api";
import { addCartLines, type CartLine, getCartLines, removeCartLine } from "@lib/cart";
import { formatMxn, getMenuItem } from "@lib/data/menu";
import { getRecentOrders, mergeRemoteOrders, type ActiveOrder } from "@lib/order";
import { getSession } from "@lib/session";
import styles from "./cart.module.css";

export default function ClientCart() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [recent, setRecent] = useState<ActiveOrder[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setLines(getCartLines());
    setRecent(getRecentOrders());

    const userId = getSession()?.user.id;
    if (!userId || userId === "local-user") {
      return;
    }

    let cancelled = false;
    void fetchUserPedidos(userId)
      .then((orders) => {
        if (!cancelled && orders.length > 0) {
          setRecent(mergeRemoteOrders(orders));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecent(getRecentOrders());
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function refreshCart() {
    setLines(getCartLines());
  }

  function remove(id: string) {
    removeCartLine(id);
    refreshCart();
  }

  function reorder(order: ActiveOrder) {
    addCartLines(order.lines);
    refreshCart();
    setNotice("Se agregó de nuevo al carrito.");
  }

  if (!lines) {
    return (
      <ClientShell>
        <div className={styles.stage}>
          <p className={styles.lead}>Cargando tu pedido…</p>
        </div>
      </ClientShell>
    );
  }

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <ClientShell>
      <div className={`${styles.stage} ${styles.stageStart}`}>
        <h1 className={styles.heading}>Carrito</h1>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {notice}
        </p>

        {lines.length === 0 ? (
          <p className={styles.lead}>Tu carrito está vacío. Agrega platillos desde Inicio o vuelve a pedir uno reciente.</p>
        ) : (
          <>
            <ul className={styles.list}>
              {lines.map((line) => {
                const item = getMenuItem(line.slug);

                return (
                  <li key={line.id} className={styles.line}>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Eliminar ${line.name} del carrito`}
                      onClick={() => remove(line.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>

                    <div className={styles.shift}>
                      <div className={styles.copy}>
                        <Link href={itemPath(line.slug)} className={styles.name}>
                          {line.quantity}× {line.name}
                        </Link>
                        {line.labels.length > 0 ? <p className={styles.meta}>{line.labels.join(" · ")}</p> : null}
                        <span className={styles.price}>{formatMxn(line.unitPrice * line.quantity)}</span>
                      </div>

                      <div className={styles.preview}>
                        {item?.image ? (
                          <Image src={item.image} alt="" fill sizes="88px" className={styles.previewImg} />
                        ) : item ? (
                          <FoodIcon glyph={item.glyph} className={styles.previewIcon} />
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={styles.checkout}>
              <p className={styles.total}>Total {formatMxn(total)}</p>
              <PayButton onClick={() => void router.push(routes.clientPay)} />
            </div>
          </>
        )}

        <RecentOrders orders={recent} defaultOpen={lines.length === 0} onReorder={reorder} />
      </div>
    </ClientShell>
  );
}
