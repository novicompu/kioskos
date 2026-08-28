import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export interface ApiErrorBody {
  status: "error";
  message: string;
}

export function getErrorMessage(err: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
  }
  return fallback;
}
