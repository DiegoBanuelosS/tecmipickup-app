import Head from "next/head";
import RestaurantShell from "../../components/restaurant/RestaurantShell";

export default function RestaurantInventarioPage() {
  return (
    <>
      <Head>
        <title>Tecmipickup | Inventario y Platillos</title>
      </Head>
      <RestaurantShell activeKey="inventario" />
    </>
  );
}
