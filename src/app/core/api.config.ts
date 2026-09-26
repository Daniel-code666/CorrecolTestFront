/**
 * URL base de la API.
 *
 * - "/api": funciona con el proxy de `npm start` y con Nginx en Docker.
 * - "http://localhost:5080/api": conexión directa al backend local; requiere
 *   que la API permita CORS para el origen donde se ejecuta Angular.
 */
export const API_BASE_URL = "/api";

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const resource = path.replace(/^\/+/, "");
  return `${base}/${resource}`;
}
