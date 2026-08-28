import { fetchMbaServiceStatus, type MbaServiceStatus } from "../integrations/novisuite.js";

// Se hace polling en background del estado de MBA (en vez de consultarlo
// en cada request) para no agregarle latencia a las consultas de
// stock/catalogo y no golpear el endpoint externo mas de lo necesario.
const POLL_INTERVAL_MS = 30_000;

let current: MbaServiceStatus = {
  status: "disconnected",
  service: "mba",
  timestamp: new Date().toISOString(),
  error: "Aun no se ha consultado el estado de MBA",
};

async function pollOnce(): Promise<void> {
  current = await fetchMbaServiceStatus();
}

export function getCachedMbaStatus(): MbaServiceStatus {
  return current;
}

export function startMbaStatusPolling(): void {
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
}
