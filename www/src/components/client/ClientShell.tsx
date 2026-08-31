import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { routes } from "@config/Router";
import { cartCount, subscribeCart } from "@lib/cart";
import { getSession, type AuthUser } from "@lib/session";
import Brand from "./Brand";
import styles from "./ClientShell.module.css";

const GlassDock = dynamic(() => import("./GlassDock"), { ssr: false });
const OrderIsland = dynamic(() => import("./OrderIsland"), { ssr: false });

type ClientShellProps = {
  /** Visible page heading. Omit it when the page renders its own h1. */
  title?: string;
  hero?: ReactNode;
  /** Edge-to-edge layout; the page owns spacing. */
  fullBleed?: boolean;
  hideTopbar?: boolean;
  hideDock?: boolean;
  children: ReactNode;
};

export default function ClientShell({ title, hero, fullBleed, hideTopbar, hideDock, children }: ClientShellProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [itemsInCart, setItemsInCart] = useState(0);

  useEffect(() => {
    setUser(getSession()?.user ?? null);
    setItemsInCart(cartCount());
    return subscribeCart(() => setItemsInCart(cartCount()));
  }, []);

  const displayName = user?.name || "Invitado";
  const matricula = user?.matricula || "Sin matrícula";

  return (
    <div className={`${styles.shell} ${fullBleed ? styles.shellBleed : ""}`}>
      <OrderIsland />

      {hideTopbar ? null : (
        <div className={styles.topbar}>
          <Brand />
        </div>
      )}

      <main className={styles.main}>
        {hero ? <div className={styles.hero}>{hero}</div> : null}

        <div className={fullBleed ? styles.bodyBleed : styles.body}>
          {title ? <h1 className={styles.heading}>{title}</h1> : null}
          {children}
        </div>
      </main>

      {hideDock ? null : (
        <GlassDock
          items={[
            { title: "Inicio", href: routes.client, glyph: "home" },
            { title: "Buscar", href: routes.clientSearch, glyph: "search" },
            {
              title: itemsInCart > 0 ? `Carrito (${itemsInCart})` : "Carrito",
              href: routes.clientCart,
              glyph: "cart",
              badge: itemsInCart,
            },
            {
              title: displayName,
              subtitle: matricula,
              glyph: "profile",
            },
          ]}
        />
      )}
    </div>
  );
}
