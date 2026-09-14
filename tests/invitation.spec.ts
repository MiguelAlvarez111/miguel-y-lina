import {test,expect} from '@playwright/test';

test('personalizes safely and keeps event actions available',async({page})=>{
 await page.goto('/?guest=Familia%20%C3%81lvarez');
 await expect(page.locator('[data-guest]')).toContainText('Familia Álvarez');
 await expect(page.getByRole('link',{name:'Cómo llegar'})).toHaveAttribute('href','https://maps.app.goo.gl/SGfUkc2BEFvSSrhG9');
 const download=page.waitForEvent('download');
 await page.getByRole('link',{name:'Apple / Outlook'}).click();
 expect((await download).suggestedFilename()).toBe('boda.ics');
});
test('photo viewer closes with Escape and returns keyboard focus',async({page})=>{
 await page.goto('/');
 const photo=page.getByRole('button',{name:'Ampliar fotografía 1'});
 await photo.click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(photo).toBeFocused();
});
for(const width of [390,430,768,1024,1440]){
 test(`all content fits at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for(const image of await page.locator('img:not([data-lightbox-image])').all()){
   await image.scrollIntoViewIfNeeded();
   await expect(image).toHaveJSProperty('complete',true);
   expect(await image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  }
 });
}
test('reduced motion keeps story visible and guest markup inert',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?guest=%3Cimg%20src=x%20onerror=alert(1)%3E');
 await expect(page.locator('[data-guest] img')).toHaveCount(0);
 await expect(page.locator('#historia')).toBeVisible();
 await expect(page.locator('#confirmar a.button')).toHaveAttribute('href','https://tally.so/r/lbxKzv');
});
