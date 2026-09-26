import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Page, params } from "../../core/api";
import { apiUrl } from "../../core/api.config";
import { Client, ClientWrite } from "./client.models";
export type ClientFilters = Record<
  string,
  string | number | boolean | undefined
>;
@Injectable({ providedIn: "root" })
export class ClientService {
  private http = inject(HttpClient);
  list(filters: ClientFilters) {
    return this.http.get<Page<Client>>(apiUrl("clientes"), {
      params: params(filters),
    });
  }
  get(id: number) {
    return this.http.get<Client>(apiUrl(`clientes/${id}`));
  }
  create(data: ClientWrite) {
    return this.http.post<Client>(apiUrl("clientes"), data);
  }
  update(id: number, data: ClientWrite) {
    return this.http.put<Client>(apiUrl(`clientes/${id}`), data);
  }
  deactivate(id: number) {
    return this.http.delete<void>(apiUrl(`clientes/${id}`));
  }
  export(filters: ClientFilters) {
    return this.http.get(apiUrl("clientes/exportacion"), {
      params: params(filters),
      responseType: "blob",
    });
  }
}
