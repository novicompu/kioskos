import { useCallback, useEffect, useState } from "react";

type GeoStatus = "idle" | "pending" | "granted" | "denied" | "unsupported" | "error" | "manual";

interface GeoState {
  status: GeoStatus;
  coords: { lat: number; long: number } | null;
  errorMessage: string | null;
}

const MANUAL_LOCATION_KEY = "payjoy:manual-location";

// Cada cuanto se vuelve a consultar el GPS mientras la app esta abierta,
// para verificar que el dispositivo siga realmente en la tienda (no solo
// confiar en la primera lectura al abrir la app).
const GPS_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

function readManualLocation(): { lat: number; long: number } | null {
  try {
    const raw = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.long === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ubicación del dispositivo, con soporte para fijar manualmente lat/long
 * (útil en kioskos fijos, o mientras se prueba sin GPS real). La ubicación
 * manual se guarda en localStorage y tiene prioridad sobre el GPS del
 * navegador hasta que se limpie explícitamente.
 *
 * `allowManual` lo controla el superadmin (ver useAppSettings): si es
 * `false`, se ignora/borra cualquier ubicación manual ya guardada y se
 * fuerza GPS real. `undefined` significa "todavía no se sabe" (mientras
 * carga la configuración) y no toma ninguna decisión hasta saberlo, para
 * no parpadear entre GPS y manual.
 */
export function useGeolocation(allowManual: boolean | undefined = true) {
  const [state, setState] = useState<GeoState>({ status: "idle", coords: null, errorMessage: null });

  const requestGps = useCallback((options?: { silent?: boolean }) => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", coords: null, errorMessage: "Este dispositivo no soporta geolocalización." });
      return;
    }

    // La revalidación periódica en segundo plano es "silenciosa": no pasa
    // por "pending" para no interrumpir la pantalla con el spinner cada
    // vez que se vuelve a verificar la ubicación.
    if (!options?.silent) {
      setState((prev) => ({ ...prev, status: "pending", errorMessage: null }));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          coords: { lat: position.coords.latitude, long: position.coords.longitude },
          errorMessage: null,
        });
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setState({
          status: denied ? "denied" : "error",
          coords: null,
          errorMessage: denied
            ? "Necesitamos acceso a tu ubicación para mostrarte el stock de la tienda más cercana."
            : "No pudimos obtener tu ubicación. Intenta de nuevo.",
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (allowManual === undefined) return; // esperando saber si esta permitido

    const manual = readManualLocation();
    if (manual && allowManual) {
      setState({ status: "manual", coords: manual, errorMessage: null });
      return;
    }
    if (manual && !allowManual) {
      // El superadmin lo desactivo despues de que este dispositivo ya
      // tenia una ubicacion manual guardada: se descarta y se fuerza GPS.
      localStorage.removeItem(MANUAL_LOCATION_KEY);
    }
    requestGps();
  }, [requestGps, allowManual]);

  // Mientras se este usando GPS real (no ubicacion manual), se revalida
  // en segundo plano cada GPS_REFRESH_INTERVAL_MS -- si el dispositivo se
  // aleja de la tienda, el catalogo/stock terminan reflejando la nueva
  // ubicacion en vez de quedarse con la lectura inicial indefinidamente.
  useEffect(() => {
    if (state.status !== "granted") return;
    const interval = setInterval(() => {
      requestGps({ silent: true });
    }, GPS_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.status, requestGps]);

  const setManualLocation = useCallback(
    (lat: number, long: number) => {
      if (allowManual === false) return; // defensivo: la UI no deberia llamar esto si esta apagado
      localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify({ lat, long }));
      setState({ status: "manual", coords: { lat, long }, errorMessage: null });
    },
    [allowManual],
  );

  const clearManualLocation = useCallback(() => {
    localStorage.removeItem(MANUAL_LOCATION_KEY);
    requestGps();
  }, [requestGps]);

  const retry = useCallback(() => requestGps(), [requestGps]);

  return { ...state, retry, setManualLocation, clearManualLocation };
}
