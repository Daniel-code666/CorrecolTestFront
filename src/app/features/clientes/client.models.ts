export const identificationTypes = [
  { value: "CedulaCiudadania", label: "Cédula de ciudadanía" },
  { value: "Nit", label: "NIT" },
  { value: "CedulaExtranjeria", label: "Cédula de extranjería" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "TarjetaIdentidad", label: "Tarjeta de identidad" },
] as const;
export type IdentificationType = (typeof identificationTypes)[number]["value"];
export interface ClientWrite {
  tipoIdentificacion: IdentificationType;
  numeroIdentificacion: string;
  razonSocial: string;
  paisCodigo: number;
  departamentoCodigo: number | null;
  ciudadCodigo: number | null;
}
export interface Client extends ClientWrite {
  id: number;
  paisNombre: string;
  departamentoNombre: string | null;
  ciudadNombre: string | null;
  active: boolean;
  creationDate: string;
  updatedDate: string | null;
}
export function typeLabel(value: string): string {
  return identificationTypes.find((t) => t.value === value)?.label ?? value;
}
