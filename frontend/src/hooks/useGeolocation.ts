import { useCallback, useEffect, useState } from "react";

type GeoStatus = "idle" | "pending" | "granted" | "denied" | "unsupported" | "error" | "manual";

interface GeoState {
  status: GeoStatus;
  coords: { lat: number; long: number } | null;
  errorMessage: string | null;
}

const MANUAL_LOCATION_KEY = "payjoy:manual-location";

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
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle", coords: null, errorMessage: null });

  const requestGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", coords: null, errorMessage: "Este dispositivo no soporta geolocalización." });
      return;
    }

    setState((prev) => ({ ...prev, status: "pending", errorMessage: null }));

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
    const manual = readManualLocation();
    if (manual) {
      setState({ status: "manual", coords: manual, errorMessage: null });
    } else {
      requestGps();
    }
  }, [requestGps]);

  const setManualLocation = useCallback((lat: number, long: number) => {
    localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify({ lat, long }));
    setState({ status: "manual", coords: { lat, long }, errorMessage: null });
  }, []);

  const clearManualLocation = useCallback(() => {
    localStorage.removeItem(MANUAL_LOCATION_KEY);
    requestGps();
  }, [requestGps]);

  return { ...state, retry: requestGps, setManualLocation, clearManualLocation };
}
