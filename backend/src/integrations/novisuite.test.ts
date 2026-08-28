import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.PAYJOY_API_BASE_URL = "https://novisuite-api.novisolutions.co";
  process.env.PAYJOY_SERVICE_KEY = "test-token";
  process.env.JWT_SECRET = "test-secret";
  process.env.COOKIE_SECRET = "test-cookie-secret";
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.resetModules();
});

describe("novisuite adapter", () => {
  it("devuelve el catalogo cuando la API responde success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: "success",
        available: true,
        warehouses: [{ id: 1451, ware_code: "007", ware_name: "007", friendly_name: "IMP FORTIN", coverage_id: 12 }],
        products: [{ codigo: "1CENV155", nombre: "Celular ENV", descripcion: "", imagenes: [], precio: 15.9, precio_formateado: "15.90", product_code: "1CENV155", product_name: "Celular ENV", stock: [] }],
        message: "Productos disponibles en su ubicacion",
      }),
    }) as unknown as typeof fetch;

    const { getProducts } = await import("./novisuite.js");
    const result = await getProducts(-2.1569, -79.8995);

    expect(result.available).toBe(true);
    expect(result.products).toHaveLength(1);
    expect((global.fetch as any).mock.calls[0][0].toString()).toContain("token=test-token");
  });

  it("lanza NovisuiteApiError cuando la API responde error de token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: "error", message: "Token invalido o no proporcionado", api_version: "v1" }),
    }) as unknown as typeof fetch;

    const { getProducts, NovisuiteApiError } = await import("./novisuite.js");

    await expect(getProducts(-2.1569, -79.8995)).rejects.toBeInstanceOf(NovisuiteApiError);
  });

  it("valida latitud fuera de rango antes de llamar a la API", async () => {
    global.fetch = vi.fn();
    const { getProducts, NovisuiteApiError } = await import("./novisuite.js");

    await expect(getProducts(999, -79.8995)).rejects.toBeInstanceOf(NovisuiteApiError);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("fetchMbaServiceStatus", () => {
  it("devuelve connected sin agregar el token de servicio a la URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: "connected",
        api_version: "v1",
        service: "mba",
        timestamp: "2026-08-27T13:56:39-05:00",
      }),
    }) as unknown as typeof fetch;

    const { fetchMbaServiceStatus } = await import("./novisuite.js");
    const result = await fetchMbaServiceStatus();

    expect(result.status).toBe("connected");
    // Probado contra la API real: agregar el token (incluso uno valido
    // para los demas endpoints) hace que este endpoint responda invalido.
    expect((global.fetch as any).mock.calls[0][0].toString()).not.toContain("token=");
  });

  it("devuelve disconnected cuando la API responde ese estado", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: "disconnected",
        service: "mba",
        error: "timeout",
        timestamp: "2026-08-27T13:56:39-05:00",
      }),
    }) as unknown as typeof fetch;

    const { fetchMbaServiceStatus } = await import("./novisuite.js");
    const result = await fetchMbaServiceStatus();

    expect(result.status).toBe("disconnected");
  });

  it("devuelve disconnected si la request falla (sin lanzar)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const { fetchMbaServiceStatus } = await import("./novisuite.js");
    const result = await fetchMbaServiceStatus();

    expect(result.status).toBe("disconnected");
    expect(result.error).toBeTruthy();
  });
});
