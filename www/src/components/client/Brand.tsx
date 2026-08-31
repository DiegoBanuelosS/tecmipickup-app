import Image from "next/image";
import Link from "next/link";
import { routes } from "@config/Router";
import styles from "./ClientShell.module.css";

export const LOGO_SRC = "/TecmiPickup.webp";

export default function Brand() {
  return (
    <Link href={routes.client} className={styles.brand} aria-label="Tecmipickup, ir al inicio">
      <Image src={LOGO_SRC} alt="" width={220} height={44} priority className={styles.brandLogo} />
    </Link>
  );
}
