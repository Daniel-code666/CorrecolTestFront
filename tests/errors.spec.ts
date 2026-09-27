import { test, expect } from "@playwright/test";
test("recuperación de error de consulta y formulario modal móvil", async ({
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
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: false })
    .click();
  const dialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await expect(dialog.getByLabel("País", { exact: false })).toBeVisible();
  expect(await dialog.locator("#country option").count()).toBeGreaterThan(1);
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
  await page.goto("/clientes");
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: false })
    .click();
  const createDialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await createDialog
    .getByLabel("Número de identificación")
    .fill("Duplicado-Prueba");
  await createDialog.getByLabel("Razón social").fill("Cliente duplicado");
  await createDialog
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
  await createDialog
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(createDialog.getByRole("alert")).toContainText(
    "Ya existe un cliente",
  );
  await expect(createDialog.getByLabel("Razón social")).toHaveValue(
    "Cliente duplicado",
  );
  await page.getByRole("button", { name: "Cerrar formulario" }).click();
  await page.route("**/api/clientes?**", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: 2147483647,
            razonSocial: "Cliente inexistente",
            tipoIdentificacion: "Nit",
            numeroIdentificacion: "NO-EXISTE",
            paisCodigo: 1,
            departamentoCodigo: null,
            ciudadCodigo: null,
            paisNombre: "País",
            departamentoNombre: null,
            ciudadNombre: null,
            active: true,
            creationDate: "2026-01-01T00:00:00Z",
            updatedDate: null,
          },
        ],
        totalRecords: 1,
        pageNumber: 1,
        pageSize: 10,
      },
    }),
  );
  await page.route("**/api/clientes/2147483647", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/problem+json",
      body: JSON.stringify({ detail: "El cliente no existe." }),
    }),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Editar Cliente inexistente" })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Editar cliente" });
  await expect(editDialog.getByRole("alert")).toContainText("no existe");
  await expect(
    editDialog.getByRole("button", { name: "Guardar cambios" }),
  ).toHaveCount(0);
});
