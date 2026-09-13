import Head from "next/head";
import RestaurantShell from "../../components/restaurant/RestaurantShell";

export default function RestaurantPedidosPage() {
  return (
    <>
      <Head>
        <title>Tecmipickup | Pedidos</title>
      </Head>
      <RestaurantShell activeKey="pedidos" />
    </>
  );
}
