import { env } from "../lib/env.js";

export interface NovisuiteWarehouse {
  id: number;
  ware_code: string;
  ware_name: string;
  friendly_name: string;
  coverage_id: number;
  // Opcionales: la API los va poblando bodega por bodega, no todas los
  // traen todavia. Nunca asumir su presencia.
  admin_name?: string | null;
  public_address?: string | null;
  contact_phone?: string | null;
}

export interface NovisuiteProduct {
  codigo: string;
  nombre: string;
  descripcion: string;
  imagenes: string[];
  precio: number;
  precio_formateado: string;
  product_code: string;
  product_name: string;
  stock: NovisuiteStock[];
}

export interface NovisuiteStock {
  warehouse_id: number;
  ware_code: string;
  ware_name?: string;
  friendly_name: string;
  coverage_id?: number;
  available: number;
}

export interface NovisuiteProductsResponse {
  status: "success" | "error";
  available: boolean;
  warehouses: NovisuiteWarehouse[];
  products: NovisuiteProduct[];
  message: string;
}

export interface NovisuiteProductDetailResponse {
  status: "success" | "error";
  available: boolean;
  warehouses: NovisuiteWarehouse[];
  product: NovisuiteProduct | null;
  products: NovisuiteProduct[];
  message: string;
}

export interface MbaServiceStatus {
  status: "connected" | "disconnected";
  service: "mba";
  timestamp: string;
  api_version?: string;
  error?: string;
}

export class NovisuiteApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "NovisuiteApiError";
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 45_000;
const cache = new Map<string, CacheEntry<unknown>>();

function roundCoord(value: number): string {
  // Redondeamos a ~5 decimales (~1m) para agrupar hits de cache sin
  // perder precision real de geolocalizacion.
  return value.toFixed(5);
}

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function validateCoords(lat: number, long: number): void {
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    throw new NovisuiteApiError("Latitud invalida", 400);
  }
  if (Number.isNaN(long) || long < -180 || long > 180) {
    throw new NovisuiteApiError("Longitud invalida", 400);
  }
}

async function callNovisuite<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, env.payjoy.baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", env.payjoy.serviceKey);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (err) {
    throw new NovisuiteApiError("No se pudo contactar el servicio de catalogo", 502);
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new NovisuiteApiError("Respuesta invalida del servicio de catalogo", 502);
  }

  if (body?.status === "error") {
    const message: string = body.message ?? "Error del servicio de catalogo";
    const statusCode = message.toLowerCase().includes("token") ? 401 : 502;
    throw new NovisuiteApiError(message, statusCode);
  }

  return body as T;
}

/**
 * Estado del servicio MBA (stock en tiempo real). A diferencia de los
 * demas endpoints, este NO lleva el `token` de servicio -- probado contra
 * la API real: sin token responde normalmente, y con cualquier token
 * (incluso el valido para los otros endpoints) responde
 * "Token de servicio invalido". Por eso usa un fetch propio en vez de
 * `callNovisuite`, que siempre agrega el token.
 */
export async function fetchMbaServiceStatus(): Promise<MbaServiceStatus> {
  const url = new URL("/api/v1/mba/service-status", env.payjoy.baseUrl);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (err) {
    return {
      status: "disconnected",
      service: "mba",
      timestamp: new Date().toISOString(),
      error: "No se pudo contactar el servicio de estado de MBA",
    };
  }

  try {
    const body: any = await response.json();
    if (body?.status === "connected" || body?.status === "disconnected") {
      return body as MbaServiceStatus;
    }
    return {
      status: "disconnected",
      service: "mba",
      timestamp: new Date().toISOString(),
      error: body?.message ?? "Respuesta inesperada del servicio de estado de MBA",
    };
  } catch {
    return {
      status: "disconnected",
      service: "mba",
      timestamp: new Date().toISOString(),
      error: "Respuesta invalida del servicio de estado de MBA",
    };
  }
}

export async function getProducts(lat: number, long: number): Promise<NovisuiteProductsResponse> {
  validateCoords(lat, long);
  const cacheKey = `products:${roundCoord(lat)}:${roundCoord(long)}`;
  const cached = getCached<NovisuiteProductsResponse>(cacheKey);
  if (cached) return cached;

  const result = await callNovisuite<NovisuiteProductsResponse>(
    "/api/v1/public/kiosko-payjoy/products",
    { lat: String(lat), long: String(long) },
  );
  setCached(cacheKey, result);
  return result;
}

export async function getProductDetail(
  productCode: string,
  lat: number,
  long: number,
): Promise<NovisuiteProductDetailResponse> {
  validateCoords(lat, long);
  const cacheKey = `product:${productCode}:${roundCoord(lat)}:${roundCoord(long)}`;
  const cached = getCached<NovisuiteProductDetailResponse>(cacheKey);
  if (cached) return cached;

  const result = await callNovisuite<NovisuiteProductDetailResponse>(
    `/api/v1/public/kiosko-payjoy/products/${encodeURIComponent(productCode)}`,
    { lat: String(lat), long: String(long) },
  );
  setCached(cacheKey, result);
  return result;
}
