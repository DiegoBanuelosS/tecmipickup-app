import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "motion/react";
import { Camera } from "lucide-react";
import ClientShell from "../../../components/client/ClientShell";
import { decodePickupQuery, getActiveOrder, type PickupTicket, getRecentOrders } from "@lib/order";
import { formatMxn } from "@lib/data/menu";
import { patchPedidoEstado } from "@lib/api";
import QrDeliveryScanner from "../../../components/delivery/QrDeliveryScanner";
import styles from "./pickup.module.css";

function ticketFromQuery(id: string, encoded: string | string[] | undefined): PickupTicket | null {
  const raw = Array.isArray(encoded) ? encoded[0] : encoded;
  if (raw) {
    const parsed = decodePickupQuery(raw);
    if (parsed) {
      return parsed;
    }
  }

  const local = getActiveOrder();
  if (local && (!id || id === "_" || local.id === id)) {
    return {
      id: local.id,
      total: local.total,
      items: local.lines.map((line) => `${line.quantity}× ${line.name}`),
      method: local.method,
    };
  }

  return null;
}

export default function PickupPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [ticket, setTicket] = useState<PickupTicket | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const [deliveredOrderName, setDeliveredOrderName] = useState<string>("");

  useEffect(() => {
    const t = ticketFromQuery(id, router.query.p);
    setTicket(t);

    if (id && id !== "_") {
      const history = getRecentOrders();
      const found = history.find((o) => o.id === id);
      if (found && (found.remoteStatus as string) === "delivered") {
        setDeliveredAt("Validado y entregado previamente.");
        setDeliveredOrderName(found.id);
      }
    }
  }, [id, router.query.p]);

  const handleDeliveryScanned = async (data: { orderId: string }) => {
    setScannerOpen(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const cleanId = data.orderId.replace(/^[^\d]*/, "") || data.orderId;

    setDeliveredAt(`Validado con éxito a las ${nowStr}. Pedido listo y entregado al estudiante.`);
    setDeliveredOrderName(cleanId);

    // Update backend status
    if (data.orderId && !data.orderId.startsWith("t")) {
      void patchPedidoEstado(data.orderId, "ENTREGADO");
    }

    // Update local order storage
    try {
      const active = getActiveOrder();
      if (active && (active.id === data.orderId || active.id === id)) {
        window.localStorage.removeItem("tecmipickup.order");
      }

      const history = getRecentOrders();
      const updated = history.map((o) =>
        o.id === data.orderId || o.id === id ? { ...o, remoteStatus: "delivered" as const } : o,
      );
      window.localStorage.setItem("tecmipickup.orders", JSON.stringify(updated));
      window.dispatchEvent(new Event("tecmipickup-order"));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setDeliveredAt(null);
    setDeliveredOrderName("");
  };

  return (
    <ClientShell>
      <div className={styles.pickupStage}>
        {deliveredAt ? (
          <motion.div
            className={styles.deliveredView}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className={styles.deliveredKicker}>Entrega confirmada</p>
            <h1 className={styles.deliveredTitle}>
              {deliveredOrderName ? `Pedido #${deliveredOrderName} entregado` : "¡Pedido entregado!"}
            </h1>
            <p className={styles.deliveredTime}>{deliveredAt}</p>

            {ticket ? (
              <>
                <ul className={styles.pickupList}>
                  {ticket.items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
                <p className={styles.total}>
                  <span>Total</span>
                  <span>{formatMxn(ticket.total)}</span>
                </p>
              </>
            ) : null}

            <motion.button
              type="button"
              onClick={handleReset}
              className={styles.resetBtn}
              whileTap={reduce ? undefined : { scale: 0.96 }}
            >
              Escanear otro pedido
            </motion.button>
          </motion.div>
        ) : (
          <>
            <p className={styles.kicker}>Recoger en campus</p>
            <h1 className={styles.title}>
              {ticket ? "Pedido en mostrador" : "Entrega en mostrador"}
            </h1>
            <p className={styles.copy}>
              {ticket
                ? ticket.method === "cash"
                  ? "Paga en efectivo al recoger."
                  : "Pagado con tarjeta."
                : "Escanea el código QR del estudiante para validar y registrar la entrega del pedido."}
            </p>

            {ticket ? (
              <>
                <ul className={styles.pickupList}>
                  {ticket.items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
                <p className={styles.total}>
                  <span>Total</span>
                  <span>{formatMxn(ticket.total)}</span>
                </p>
              </>
            ) : null}

            <div className={styles.deliverSection}>
              <motion.button
                type="button"
                onClick={() => setScannerOpen(true)}
                className={styles.deliverBtn}
                whileTap={reduce ? undefined : { scale: 0.97 }}
              >
                <Camera className={styles.deliverIcon} />
                <span>Escanear QR de entrega</span>
              </motion.button>
            </div>
          </>
        )}
      </div>

      <QrDeliveryScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSuccess={handleDeliveryScanned}
        targetOrderId={id && id !== "_" ? id : undefined}
      />
    </ClientShell>
  );
}

export function getStaticPaths() {
  return {
    paths: [{ params: { id: "_" } }],
    fallback: false,
  };
}

export function getStaticProps() {
  return { props: {} };
}
