import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { MbaStatus } from "../api/types";

/**
 * El backend hace polling en background del estado de MBA (ver
 * backend/src/lib/mbaStatus.ts) y expone el ultimo valor conocido en
 * /api/mba-status -- esta consulta es liviana (nunca golpea la API
 * externa directamente). Se vuelve a pedir cada 20s para reflejar
 * cambios de estado sin necesidad de recargar la pagina.
 */
export function useMbaStatus() {
  return useQuery({
    queryKey: ["mba-status"],
    queryFn: async () => {
      const { data } = await api.get<MbaStatus>("/mba-status");
      return data;
    },
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
}
