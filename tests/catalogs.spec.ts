import { test, expect } from "@playwright/test";

test("consulta países y navega por departamentos y ciudades con paginación", async ({
  page,
}) => {
  await page.goto("/paises");
  await expect(
    page.getByRole("heading", { name: "Países", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1–20 de 246 registros")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Países", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Clientes", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText("21–40 de 246 registros")).toBeVisible();
  await page.getByLabel("Nombre", { exact: true }).fill("COLOMBIA");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "BOGOTÁ", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ver departamentos de COLOMBIA" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Departamentos", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#catalog-country option:checked")).toHaveText(
    "COLOMBIA",
  );
  await expect(page.getByText("1–20 de 33 registros")).toBeVisible();
  await page.getByRole("link", { name: "Ver ciudades de ANTIOQUIA" }).click();
  await expect(
    page.getByRole("heading", { name: "Ciudades", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1–20 de 125 registros")).toBeVisible();
  await expect(page.locator("#catalog-department option:checked")).toHaveText(
    "ANTIOQUIA",
  );
  await page.getByLabel("Nombre", { exact: true }).fill("MEDELLIN");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("1–1 de 1 registros")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "5001", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/catalogo-ciudades-desktop.png",
    fullPage: true,
  });
  await page
    .getByLabel("País", { exact: true })
    .selectOption({ label: "AFGANISTÁN" });
  await expect(page.locator("#catalog-department option:checked")).toHaveText(
    "Todos los departamentos",
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No hay resultados" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.getByText("1–20 de 1118 registros")).toBeVisible();
  await page.getByLabel("Código", { exact: true }).fill("5001");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("1–1 de 1 registros")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/catalogo-ciudades-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("el catálogo permite reintentar una consulta fallida", async ({
  page,
}) => {
  await page.route("**/api/paises?**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/problem+json",
      body: JSON.stringify({ detail: "Error temporal del catálogo." }),
    }),
  );
  await page.goto("/paises");
  await expect(page.getByRole("alert")).toContainText(
    "Error temporal del catálogo.",
  );
  await page.unroute("**/api/paises?**");
  await page.getByRole("button", { name: "Reintentar consulta" }).click();
  await expect(page.getByText("1–20 de 246 registros")).toBeVisible();
});
