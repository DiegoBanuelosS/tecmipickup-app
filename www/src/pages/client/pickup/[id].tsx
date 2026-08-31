import { useRouter } from "next/router";
import ClientShell from "../../../components/client/ClientShell";
import { decodePickupQuery, getActiveOrder, type PickupTicket } from "@lib/order";
import { formatMxn } from "@lib/data/menu";
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
  if (local && local.id === id) {
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
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const ticket = id ? ticketFromQuery(id, router.query.p) : null;

  return (
    <ClientShell>
      <div className={styles.pickupStage}>
        <p className={styles.kicker}>Recoger en campus</p>
        <h1 className={styles.title}>{ticket ? "Pedido en mostrador" : "Pedido no encontrado"}</h1>
        {ticket ? (
          <>
            <p className={styles.copy}>
              {ticket.method === "cash" ? "Paga en efectivo al recoger." : "Pagado con tarjeta."}
            </p>
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
        ) : (
          <p className={styles.copy}>Este código no corresponde a un pedido vigente.</p>
        )}
      </div>
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
