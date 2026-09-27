import { HttpErrorResponse, HttpParams } from "@angular/common/http";
export interface Page<T> {
  items: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}

export function params(
  values: Record<string, string | number | boolean | null | undefined>,
): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== null)
      result = result.set(key, String(value));
  return result;
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return "No se pudo conectar con el servidor. Comprueba tu conexión e intenta de nuevo.";
    const body = error.error;
    if (body?.errors) return Object.values(body.errors).flat().join(" ");
    if (body?.detail) return body.detail;
    if (error.status === 404) return "El registro solicitado no existe.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}
