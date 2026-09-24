import { test, expect } from "@playwright/test";
test("crear, editar, exportar y desactivar con catálogos reales", async ({
  page,
}) => {
  const number = `QA${Date.now()}`;
  const name = `Cliente de prueba ${number}`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/clientes");
  await expect(
    page.getByRole("heading", { name: "Clientes", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buscar", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "artifacts/listado-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Nuevo cliente", exact: false }).click();
  await page
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(page.getByText("Ingresa una razón social")).toBeVisible();
  await page.getByLabel("Número de identificación").fill(number);
  await page.getByLabel("Razón social").fill(name);
  await page
    .getByLabel("País", { exact: false })
    .selectOption({ label: "COLOMBIA" });
  await page
    .getByLabel("Departamento", { exact: false })
    .selectOption({ label: "ANTIOQUIA" });
  await expect(page.locator("#city option")).toHaveCount(126);
  await page
    .getByLabel("Ciudad / Municipio", { exact: false })
    .selectOption({ label: "MEDELLIN" });
  await page.screenshot({
    path: "artifacts/formulario-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("creado correctamente");
  await page.getByLabel("Identificación", { exact: true }).fill(number);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.getByRole("link", { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByLabel("Número de identificación")).toHaveValue(number);
  await expect(page.locator("#city option:checked")).toHaveText("MEDELLIN");
  await page
    .getByLabel("País", { exact: false })
    .selectOption({ label: "AFGANISTÁN" });
  await expect(
    page.getByLabel("Departamento", { exact: false }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Ciudad / Municipio", { exact: false }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toContainText(
    "actualizado correctamente",
  );
  await page.getByLabel("Identificación", { exact: true }).fill(number);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar Excel", exact: false })
    .click();
  expect((await download).suggestedFilename()).toBe("clientes.xlsx");
  await page
    .getByRole("button", { name: `Desactivar ${name}`, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar desactivación" }).click();
  await expect(page.getByRole("status")).toContainText(
    "desactivado correctamente",
  );
  await page.getByLabel("Estado", { exact: true }).selectOption("false");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Solo consulta" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/listado-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
