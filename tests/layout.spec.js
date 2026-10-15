import {test,expect} from '@playwright/test';

for (const viewport of [
  {width:1474,height:1050,name:'iPad landscape'},
  {width:1024,height:768,name:'small landscape tablet'},
  {width:768,height:1024,name:'iPad portrait'},
  {width:390,height:844,name:'phone'},
]) {
  test('photographic hero is bounded and readable at '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.welcomePanel')).toBeVisible();
    await expect(page.locator('.welcomePanelCopy h2')).toBeVisible();
    await expect(page.locator('.welcomePanelMedia')).toBeVisible();

    const geometry=await page.evaluate(()=>{
      const hero=document.querySelector('.welcomePanel');
      const copy=document.querySelector('.welcomePanelCopy');
      const heading=document.querySelector('.welcomePanelCopy h2');
      const media=document.querySelector('.welcomePanelMedia');
      const rect=(node)=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width}};
      return {
        hero:rect(hero),copy:rect(copy),heading:rect(heading),media:rect(media),
        heroOverflow:hero.scrollWidth-hero.clientWidth,
        headingOverflow:heading.scrollWidth-heading.clientWidth,
        documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        headingFont:getComputedStyle(heading).fontFamily,
      };
    });

    expect(geometry.heroOverflow,'Hero must not clip horizontally').toBeLessThanOrEqual(2);
    expect(geometry.headingOverflow,'Heading content must fit inside its text column').toBeLessThanOrEqual(2);
    expect(geometry.documentOverflow,'The page must not scroll sideways').toBeLessThanOrEqual(2);
    expect(geometry.headingFont).toContain('Instrument Serif');
    if(viewport.width>800) {
      expect(geometry.copy.right,'Text column cannot overlap the photograph').toBeLessThanOrEqual(geometry.media.left+2);
      expect(geometry.heading.right,'Headline cannot overlap the photograph').toBeLessThanOrEqual(geometry.media.left+2);
    } else {
      expect(geometry.media.top,'Mobile photo must stack below headline').toBeGreaterThanOrEqual(geometry.copy.bottom-2);
    }

    await page.getByRole('button',{name:'Guest menu'}).click();
    await expect(page.locator('.dinerHeader')).toBeVisible();
    await expect(page.getByText('Important food allergy information')).toBeVisible();
    const customerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(customerOverflow,'Diner view must not scroll sideways').toBeLessThanOrEqual(2);
  });
}
