import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { CatalogService } from "./catalog.service";
describe("Catálogos completos", () => {
  it("recupera los 125 municipios de dos páginas antes de emitir las opciones", () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: unknown[] = [];
    TestBed.inject(CatalogService)
      .cities(5)
      .subscribe((items) => (result = items));
    const first = http.expectOne(
      (r) =>
        r.url === "/api/ciudades" &&
        r.params.get("pageNumber") === "1" &&
        r.params.get("departamentoCodigo") === "5",
    );
    first.flush({
      items: Array.from({ length: 100 }, (_, i) => ({
        codigo: i + 1,
        nombre: `Ciudad ${i}`,
      })),
      totalRecords: 125,
      pageNumber: 1,
      pageSize: 100,
    });
    expect(result.length).toBe(0);
    http
      .expectOne((r) => r.params.get("pageNumber") === "2")
      .flush({
        items: Array.from({ length: 25 }, (_, i) => ({
          codigo: 101 + i,
          nombre: `Ciudad ${101 + i}`,
        })),
        totalRecords: 125,
        pageNumber: 2,
        pageSize: 100,
      });
    expect(result.length).toBe(125);
    http.verify();
  });
});
