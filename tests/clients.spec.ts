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
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: false })
    .click();
  const createDialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await expect(createDialog).toBeVisible();
  await createDialog
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(
    createDialog.getByText("Ingresa una razón social"),
  ).toBeVisible();
  await createDialog.getByLabel("Número de identificación").fill(number);
  await createDialog.getByLabel("Razón social").fill(name);
  await createDialog
    .getByLabel("País", { exact: false })
    .selectOption({ label: "COLOMBIA" });
  await createDialog
    .getByLabel("Departamento", { exact: false })
    .selectOption({ label: "ANTIOQUIA" });
  await expect(createDialog.locator("#city option")).toHaveCount(126);
  await createDialog
    .getByLabel("Ciudad / Municipio", { exact: false })
    .selectOption({ label: "MEDELLIN" });
  await page.screenshot({
    path: "artifacts/formulario-desktop.png",
    fullPage: true,
  });
  await createDialog
    .getByRole("button", { name: "Crear cliente", exact: true })
    .click();
  await expect(
    page.getByText("Cliente creado correctamente.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Identificación", { exact: true }).fill(number);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page
    .getByRole("button", { name: `Editar ${name}`, exact: true })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Editar cliente" });
  await expect(editDialog.getByLabel("Número de identificación")).toHaveValue(
    number,
  );
  await expect(editDialog.locator("#city option:checked")).toHaveText(
    "MEDELLIN",
  );
  await editDialog
    .getByLabel("País", { exact: false })
    .selectOption({ label: "AFGANISTÁN" });
  await expect(
    editDialog.getByLabel("Departamento", { exact: false }),
  ).toBeDisabled();
  await expect(
    editDialog.getByLabel("Ciudad / Municipio", { exact: false }),
  ).toBeDisabled();
  await editDialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.getByText("Cliente actualizado correctamente.", { exact: true }),
  ).toBeVisible();
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
  await expect(
    page.getByText("El cliente fue desactivado correctamente.", {
      exact: true,
    }),
  ).toBeVisible();
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
