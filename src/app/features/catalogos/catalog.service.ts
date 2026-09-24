import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { expand, reduce, EMPTY, Observable, shareReplay } from "rxjs";
import { Page, params } from "../../core/api";
export interface CatalogItem {
  codigo: number;
  nombre: string;
  paisCodigo?: number;
  departamentoCodigo?: number;
  iso1?: string;
  iso2?: string;
  capital?: string;
}
export type CatalogResource = "paises" | "departamentos" | "ciudades";
@Injectable({ providedIn: "root" })
export class CatalogService {
  private http = inject(HttpClient);
  private countries$: Observable<CatalogItem[]> | undefined;
  countries() {
    return (this.countries$ ??= this.all("paises").pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
    ));
  }
  departments(paisCodigo?: number) {
    return this.all("departamentos", paisCodigo ? { paisCodigo } : {});
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
  private all(resource: string, filters: Record<string, number> = {}) {
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
