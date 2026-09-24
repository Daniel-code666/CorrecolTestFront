import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { expand, reduce, EMPTY } from "rxjs";
import { Page, params } from "../../core/api";
export interface CatalogItem {
  active: boolean;
  creationDate?: string;
  updatedDate?: string | null;
  codigo: number;
  nombre: string;
  paisCodigo?: number;
  departamentoCodigo?: number;
  iso1?: string;
  iso2?: string;
  capital?: string;
}
export type CatalogResource = "paises" | "departamentos" | "ciudades";
export interface CountryWrite {
  nombre: string;
  iso1: string;
  iso2: string;
  capital: string;
}
export type CatalogUpdate = CountryWrite | { nombre: string };
export type CatalogCreate =
  | (CountryWrite & { codigo: number })
  | { codigo: number; nombre: string; paisCodigo: number }
  | { codigo: number; nombre: string; departamentoCodigo: number };
@Injectable({ providedIn: "root" })
export class CatalogService {
  private http = inject(HttpClient);
  countries(includeInactive = false) {
    return this.all("paises", includeInactive ? { active: "" } : {});
  }
  departments(paisCodigo?: number, includeInactive = false) {
    return this.all("departamentos", {
      paisCodigo,
      ...(includeInactive ? { active: "" } : {}),
    });
  }
  get(resource: CatalogResource, code: number) {
    return this.http.get<CatalogItem>(`/api/${resource}/${code}`);
  }
  create(resource: CatalogResource, data: CatalogCreate) {
    return this.http.post<CatalogItem>(`/api/${resource}`, data);
  }
  update(resource: CatalogResource, code: number, data: CatalogUpdate) {
    return this.http.put<CatalogItem>(`/api/${resource}/${code}`, data);
  }
  deactivate(resource: CatalogResource, code: number) {
    return this.http.delete<void>(`/api/${resource}/${code}`);
  }
  list(
    resource: CatalogResource,
    filters: Record<string, string | number | null | undefined>,
  ) {
    return this.http.get<Page<CatalogItem>>(`/api/${resource}`, {
      params: params(filters),
    });
  }
  cities(departamentoCodigo: number) {
    return this.all("ciudades", { departamentoCodigo });
  }
  private all(
    resource: string,
    filters: Record<string, number | string | undefined> = {},
  ) {
    const page = (pageNumber: number) =>
      this.http.get<Page<CatalogItem>>(`/api/${resource}`, {
        params: params({ ...filters, pageSize: 100, pageNumber }),
      });
    return page(1).pipe(
      expand((result) =>
        result.pageNumber * result.pageSize < result.totalRecords
          ? page(result.pageNumber + 1)
          : EMPTY,
      ),
      reduce((all, result) => all.concat(result.items), [] as CatalogItem[]),
    );
  }
}
