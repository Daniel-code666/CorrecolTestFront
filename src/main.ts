import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { App } from "./app/app";
bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(
      [
        {
          path: "clientes",
          loadComponent: () =>
            import("./app/features/clientes/client-list").then(
              (m) => m.ClientList,
            ),
        },
        {
          path: "clientes/nuevo",
          loadComponent: () =>
            import("./app/features/clientes/client-form").then(
              (m) => m.ClientForm,
            ),
        },
        {
          path: "clientes/:id/editar",
          loadComponent: () =>
            import("./app/features/clientes/client-form").then(
              (m) => m.ClientForm,
            ),
        },
        ...(["paises", "departamentos", "ciudades"] as const).map(
          (resource) => ({
            path: resource,
            data: { resource },
            loadComponent: () =>
              import("./app/features/catalogos/catalog-list").then(
                (m) => m.CatalogList,
              ),
          }),
        ),
        { path: "", redirectTo: "clientes", pathMatch: "full" },
        { path: "**", redirectTo: "clientes" },
      ],
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
  ],
}).catch(console.error);
