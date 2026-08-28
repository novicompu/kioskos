import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { SettingsResponse } from "../api/types";

/** Configuracion global (controlada por el superadmin), ej. si se permite fijar ubicacion manual. */
export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data } = await api.get<SettingsResponse>("/settings");
      return data.settings;
    },
    staleTime: 30_000,
  });
}
