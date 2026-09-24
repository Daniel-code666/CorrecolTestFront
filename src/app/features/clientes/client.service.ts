import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Page, params } from "../../core/api";
import { Client, ClientWrite } from "./client.models";
export type ClientFilters = Record<
  string,
  string | number | boolean | undefined
>;
@Injectable({ providedIn: "root" })
export class ClientService {
  private http = inject(HttpClient);
  list(filters: ClientFilters) {
    return this.http.get<Page<Client>>("/api/clientes", {
      params: params(filters),
    });
  }
  get(id: number) {
    return this.http.get<Client>(`/api/clientes/${id}`);
  }
  create(data: ClientWrite) {
    return this.http.post<Client>("/api/clientes", data);
  }
  update(id: number, data: ClientWrite) {
    return this.http.put<Client>(`/api/clientes/${id}`, data);
  }
  deactivate(id: number) {
    return this.http.delete<void>(`/api/clientes/${id}`);
  }
  export(filters: ClientFilters) {
    return this.http.get("/api/clientes/exportacion", {
      params: params(filters),
      responseType: "blob",
    });
  }
}
