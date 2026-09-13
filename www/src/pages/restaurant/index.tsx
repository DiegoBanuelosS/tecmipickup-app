import Head from "next/head";
import RestaurantShell from "../../components/restaurant/RestaurantShell";
import Kanban6 from "./kanban-6";

export default function RestaurantPage() {
  return (
    <>
      <Head>
        <title>Tecmipickup | Restaurante</title>
      </Head>
      <RestaurantShell activeKey="inicio">
        <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
          <Kanban6 />
        </div>
      </RestaurantShell>
    </>
  );
}
