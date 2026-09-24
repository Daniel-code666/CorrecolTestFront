import { test, expect } from "@playwright/test";

test("CRUD real de país, departamento y ciudad, restricciones y consulta de inactivos", async ({
  page,
  request,
}) => {
  const tag = Date.now().toString();
  const countryCode = 30000 + Number(tag.slice(-3));
  const departmentCode = 100000000 + Number(tag.slice(-7));
  const cityCode = departmentCode + 10000000;
  const countryName = `QA País ${tag}`;
  const departmentName = `QA Departamento ${tag}`;
  const cityName = `QA Ciudad ${tag}`;
  const created: { resource: string; code: number }[] = [];
  const runtimeErrors: string[] = [];
  page.on("pageerror", (e) => runtimeErrors.push(e.message));
  const dialog = page.getByRole("dialog");
  const filter = async (code: number) => {
    await page.locator("#catalog-code").fill(String(code));
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
  };
  const create = async (resource: string, code: number, name: string) => {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/${resource}`) && r.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: /^Crear / }).click();
    expect((await response).status()).toBe(201);
    created.push({ resource, code });
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("status").filter({ hasText: `Se guardó ${name}` }),
    ).toBeVisible();
    await filter(code);
  };
  const edit = async (resource: string, code: number, name: string) => {
    await page
      .getByRole("button", { name: `Editar ${name}`, exact: true })
      .click();
    await expect(dialog.getByLabel("Código", { exact: true })).toBeDisabled();
    await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue(
      name,
    );
    if (resource !== "paises")
      await expect(dialog.getByLabel("País", { exact: true })).toBeDisabled();
    if (resource === "ciudades")
      await expect(
        dialog.getByLabel("Departamento", { exact: true }),
      ).toBeDisabled();
    await dialog.getByLabel("Nombre", { exact: true }).fill(`${name} editado`);
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/${resource}/${code}`) &&
        r.request().method() === "PUT",
    );
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();
    const result = await response;
    expect(result.status()).toBe(200);
    expect(Object.keys(result.request().postDataJSON()).sort()).toEqual(
      resource === "paises"
        ? ["capital", "iso1", "iso2", "nombre"]
        : ["nombre"],
    );
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("cell", { name: `${name} editado`, exact: true }),
    ).toBeVisible();
  };
  try {
    expect((await request.get(`/api/paises/${countryCode}`)).status()).toBe(
      404,
    );
    await page.goto("/paises");
    await page
      .getByRole("button", { name: "Nuevo país", exact: false })
      .click();
    await dialog
      .getByRole("button", { name: "Crear país", exact: true })
      .click();
    await expect(
      dialog.getByText("Ingresa un nombre de hasta 100 caracteres."),
    ).toBeVisible();
    await dialog
      .getByLabel("Código", { exact: true })
      .fill(String(countryCode));
    await dialog.getByLabel("Nombre", { exact: true }).fill(countryName);
    await dialog.getByLabel("ISO 1", { exact: true }).fill("qaa");
    await dialog.getByLabel("ISO 2", { exact: true }).fill("qa");
    await dialog
      .getByLabel("Capital", { exact: true })
      .fill("Capital de prueba");
    await page.screenshot({
      path: "artifacts/catalogo-crear-pais.png",
      fullPage: true,
    });
    await create("paises", countryCode, countryName);
    await edit("paises", countryCode, countryName);

    // El país creado y editado debe estar disponible para clientes sin recargar la aplicación.
    await page.getByRole("link", { name: "Clientes", exact: true }).click();
    await page
      .getByRole("link", { name: "Nuevo cliente", exact: false })
      .click();
    await page
      .getByLabel("País", { exact: false })
      .selectOption({ label: `${countryName} editado` });

    await page
      .getByRole("link", { name: "Departamentos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Nuevo departamento", exact: false })
      .click();
    await dialog
      .getByLabel("Código", { exact: true })
      .fill(String(departmentCode));
    await dialog.getByLabel("Nombre", { exact: true }).fill(departmentName);
    await dialog
      .getByLabel("País", { exact: true })
      .selectOption({ label: `${countryName} editado` });
    await create("departamentos", departmentCode, departmentName);
    await edit("departamentos", departmentCode, departmentName);

    await page.getByRole("link", { name: "Ciudades", exact: true }).click();
    await page
      .getByRole("button", { name: "Nueva ciudad", exact: false })
      .click();
    await dialog.getByLabel("Código", { exact: true }).fill(String(cityCode));
    await dialog.getByLabel("Nombre", { exact: true }).fill(cityName);
    await dialog
      .getByLabel("País", { exact: true })
      .selectOption({ label: `${countryName} editado` });
    await dialog
      .getByLabel("Departamento", { exact: true })
      .selectOption({ label: `${departmentName} editado` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "artifacts/catalogo-crear-ciudad-mobile.png",
      fullPage: true,
    });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await create("ciudades", cityCode, cityName);
    await edit("ciudades", cityCode, cityName);

    await page.getByRole("link", { name: "Países", exact: true }).click();
    await filter(countryCode);
    await page
      .getByRole("button", {
        name: `Desactivar ${countryName} editado`,
        exact: true,
      })
      .click();
    await dialog
      .getByRole("button", { name: "Confirmar desactivación" })
      .click();
    await expect(dialog.getByRole("alert")).toContainText(
      "departamentos activos",
    );
    await dialog.getByRole("button", { name: "Cancelar" }).click();

    for (const [resource, code, name, nav] of [
      ["ciudades", cityCode, cityName, "Ciudades"],
      ["departamentos", departmentCode, departmentName, "Departamentos"],
      ["paises", countryCode, countryName, "Países"],
    ] as const) {
      await page.getByRole("link", { name: nav, exact: true }).click();
      await filter(code);
      await page
        .getByRole("button", {
          name: `Desactivar ${name} editado`,
          exact: true,
        })
        .click();
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith(`/api/${resource}/${code}`) &&
          r.request().method() === "DELETE",
      );
      await dialog
        .getByRole("button", { name: "Confirmar desactivación" })
        .click();
      expect((await response).status()).toBe(204);
      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "No hay resultados" }),
      ).toBeVisible();
      await page.getByLabel("Estado", { exact: true }).selectOption("false");
      await page.getByRole("button", { name: "Buscar", exact: true }).click();
      await page
        .getByRole("button", { name: `Consultar ${name} editado`, exact: true })
        .click();
      await expect(dialog.getByLabel("Nombre", { exact: true })).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Guardar cambios" }),
      ).toHaveCount(0);
      await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
    }
    expect(runtimeErrors).toEqual([]);
  } finally {
    // Solo los registros creados en esta prueba; nunca modifica catálogos existentes.
    for (const item of created.reverse())
      await request.delete(`/api/${item.resource}/${item.code}`);
  }
});

test("duplicado muestra el conflicto y conserva el formulario", async ({
  page,
}) => {
  await page.goto("/paises");
  await page.getByRole("button", { name: "Nuevo país", exact: false }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Código", { exact: true }).fill("170");
  await dialog
    .getByLabel("Nombre", { exact: true })
    .fill("Duplicado de prueba");
  await dialog.getByLabel("ISO 1", { exact: true }).fill("COL");
  await dialog.getByLabel("ISO 2", { exact: true }).fill("CO");
  await dialog.getByLabel("Capital", { exact: true }).fill("BOGOTÁ");
  await dialog.getByRole("button", { name: "Crear país", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("ya está registrado");
  await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Duplicado de prueba",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
