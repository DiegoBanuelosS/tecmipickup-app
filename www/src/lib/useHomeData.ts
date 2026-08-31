import { useEffect, useState } from "react";
import {
  defaultHomeCounts,
  fetchHomeData,
  getExpectedCounts,
  type HomeCounts,
  type HomeData,
} from "./api/home";

type HomeState = {
  data: HomeData | null;
  loading: boolean;
  /** Cantidad real de elementos esperados, disponible antes de que llegue la data. */
  counts: HomeCounts;
};

export function useHomeData(): HomeState {
  // Inicia con los conteos base para que SSR e hidratación coincidan.
  const [data, setData] = useState<HomeData | null>(null);
  const [counts, setCounts] = useState<HomeCounts>(defaultHomeCounts);

  useEffect(() => {
    // Ya en cliente, toma los conteos reales de la última carga.
    setCounts(getExpectedCounts());

    let cancelled = false;
    void fetchHomeData().then((result) => {
      if (!cancelled) {
        setData(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading: data === null, counts };
}
