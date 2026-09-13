import { ReactNode } from "react";
import RestaurantSidebar from "./RestaurantSidebar";
import styles from "./RestaurantShell.module.css";

interface RestaurantShellProps {
  children?: ReactNode;
  activeKey?: "inicio" | "pedidos" | "inventario";
}

export default function RestaurantShell({ children, activeKey = "inicio" }: RestaurantShellProps) {
  return (
    <div className={styles.layout}>
      <RestaurantSidebar activeKey={activeKey} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
