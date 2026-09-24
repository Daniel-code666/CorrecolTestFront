import { test, expect } from "@playwright/test";
test("recuperación de error de consulta y recarga directa de ruta móvil", async ({
  page,
}) => {
  await page.route("**/api/clientes?**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/problem+json",
      body: JSON.stringify({ detail: "Error de consulta de prueba." }),
    }),
  );
  await page.goto("/clientes");
  await expect(page.getByRole("alert")).toContainText(
    "Error de consulta de prueba.",
  );
  await page.unroute("**/api/clientes?**");
  await page.getByRole("button", { name: "Reintentar consulta" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Buscar", exact: true }),
  ).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/clientes/nuevo");
  await expect(page.getByLabel("País", { exact: false })).toBeVisible();
  await expect(page.locator("#country option")).toHaveCount(247);
  await page.screenshot({
    path: "artifacts/formulario-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("conflicto conserva datos y cliente inexistente no muestra formulario editable", async ({
  page,
}) => {
  await page.goto("/clientes/nuevo");
  await page.getByLabel("Número de identificación").fill("Duplicado-Prueba");
  await page.getByLabel("Razón social").fill("Cliente duplicado");
  await page
    .getByLabel("País", { exact: false })
    .selectOption({ label: "AFGANISTÁN" });
  await page.route("**/api/clientes", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/problem+json",
      body: JSON.stringify({
        detail: "Ya existe un cliente con ese tipo y número de identificación.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Ya existe un cliente");
  await expect(page.getByLabel("Razón social")).toHaveValue(
    "Cliente duplicado",
  );
  await page.goto("/clientes/2147483647/editar");
  await expect(page.getByRole("alert")).toContainText("no existe");
  await expect(
    page.getByRole("button", { name: "Guardar cambios" }),
  ).toHaveCount(0);
});
