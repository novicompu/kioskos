export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
}

export interface Warehouse {
  id: number;
  ware_code: string;
  ware_name: string;
  friendly_name: string;
  coverage_id: number;
  // Opcionales: la API los va poblando bodega por bodega, no todas los
  // traen todavia.
  administrator_name?: string | null;
  contact_location?: string | null;
  contact_phone?: string | null;
}

export interface StockEntry {
  warehouse_id: number;
  ware_code: string;
  friendly_name: string;
  available: number;
}

export interface Product {
  codigo: string;
  nombre: string;
  descripcion: string;
  imagenes: string[];
  precio: number;
  precio_formateado: string;
  product_code: string;
  product_name: string;
  stock: StockEntry[];
}

export interface CatalogResponse {
  status: "success" | "error";
  available: boolean;
  warehouses: Warehouse[];
  products: Product[];
  message: string;
}

export interface ProductDetailResponse {
  status: "success" | "error";
  available: boolean;
  warehouses: Warehouse[];
  product: Product | null;
  products: Product[];
  message: string;
}

export interface Kiosk {
  wareCode: string;
  wareName: string;
  friendlyName: string;
  displayName: string;
  supervisor: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
}

export interface KiosksResponse {
  status: "success" | "error";
  available: boolean;
  kiosks: Kiosk[];
}

export interface MbaStatus {
  status: "connected" | "disconnected";
  service: "mba";
  timestamp: string;
  error?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  createdAt: string;
}

export interface UsersListResponse {
  status: "success" | "error";
  users: ManagedUser[];
}
