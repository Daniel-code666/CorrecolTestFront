import { test, expect } from '@playwright/test';

test('cambia cantidad sin recargar, conserva filtros y vuelve a primera página', async ({page}) => {
  let documentRequests=0;
  page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame()) documentRequests++;});
  const requests:URL[]=[];
  await page.route('**/api/clientes?**',async route=>{
    const url=new URL(route.request().url());requests.push(url);
    const size=Number(url.searchParams.get('pageSize'));
    const number=Number(url.searchParams.get('pageNumber'));
    const offset=(number-1)*size;
    const items=Array.from({length:Math.min(size,65-offset)},(_,index)=>({id:offset+index+1,razonSocial:`Empresa ${offset+index+1}`,tipoIdentificacion:'Nit',numeroIdentificacion:`900${offset+index}`,paisNombre:'COLOMBIA',departamentoNombre:'ANTIOQUIA',ciudadNombre:'MEDELLIN',active:true}));
    await route.fulfill({json:{items,totalRecords:65,pageNumber:number,pageSize:size}});
  });
  await page.goto('/clientes');
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByLabel('Razón social',{exact:true}).fill('Empresa');
  await page.getByRole('button',{name:'Buscar',exact:true}).click();
  await expect(page.getByLabel('Clientes por página')).toBeEnabled();
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.getByText('11–20 de 65 clientes')).toBeVisible();
  for(const size of [20,30,10]){
    await page.getByLabel('Clientes por página').selectOption(String(size));
    await expect(page.locator('tbody tr')).toHaveCount(size);
    await expect(page.getByText(`1–${size} de 65 clientes`)).toBeVisible();
    expect(requests.at(-1)?.searchParams.get('pageNumber')).toBe('1');
    expect(requests.at(-1)?.searchParams.get('razonSocial')).toBe('Empresa');
    await expect(page.getByLabel('Razón social',{exact:true})).toHaveValue('Empresa');
  }
  expect(documentRequests).toBe(1);
});
