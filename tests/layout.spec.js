import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

for (const viewport of [
  {width:1474,height:1050,name:'iPad landscape'},
  {width:1024,height:768,name:'small landscape tablet'},
  {width:768,height:1024,name:'iPad portrait'},
  {width:390,height:844,name:'phone'},
]) {
  test('photographic hero is bounded and readable at '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('./',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.welcomePanel')).toBeVisible();
    await expect(page.locator('.welcomePanelCopy h2')).toBeVisible();
    await expect(page.locator('.welcomePanelMedia')).toBeVisible();
    // Fontsource assets must finish loading before checking the real typographic geometry.
    await page.evaluate(()=>document.fonts.ready);
    const fontsReady=await page.evaluate(()=>({
      display:document.fonts.check('400 48px "Instrument Serif"'),
      body:document.fonts.check('400 14px "Plus Jakarta Sans"'),
    }));
    expect(fontsReady.display,'The display typeface must load from bundled assets').toBe(true);
    expect(fontsReady.body,'The functional typeface must load from bundled assets').toBe(true);

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

    // Reference-quality gallery cards must reserve separate photo and content regions.
    const firstCard=page.locator('.signatureCard').first();
    await expect(firstCard).toBeVisible();
    const cardParts=await firstCard.evaluate((card)=>{
      const image=card.querySelector('.signatureImage').getBoundingClientRect();
      const details=card.querySelector('.signatureCardText').getBoundingClientRect();
      const root=card.getBoundingClientRect();
      const action=card.querySelector('.signatureCardText button').getBoundingClientRect();
      return {imageBottom:image.bottom,detailsTop:details.top,cardRight:root.right,
        actionWidth:action.width,actionHeight:action.height,viewportWidth:document.documentElement.clientWidth};
    });
    expect(cardParts.detailsTop,'Dish text must begin BELOW the food photograph').toBeGreaterThanOrEqual(cardParts.imageBottom-2);
    expect(cardParts.cardRight,'Dish card must not spill beyond the viewport').toBeLessThanOrEqual(cardParts.viewportWidth+2);
    expect(cardParts.actionWidth,'Dish action must have a touch-friendly width').toBeGreaterThanOrEqual(42);
    expect(cardParts.actionHeight,'Dish action must have a touch-friendly height').toBeGreaterThanOrEqual(42);
    const headlineFits=await page.locator('.welcomePanel h2').evaluate((element)=>{
      const heading=element.getBoundingClientRect(),column=element.closest('.welcomePanelCopy').getBoundingClientRect();
      return heading.right<=column.right+2 && heading.left>=column.left-2;
    });
    expect(headlineFits,'Editorial hero heading must remain in its dedicated column').toBe(true);

    // Preserve real browser captures to compare against the user's approved visual references.
    const captureName=viewport.name.toLowerCase().replaceAll(' ','-');
    mkdirSync('test-results/visual',{recursive:true});
    await page.screenshot({path:'test-results/visual/business-'+captureName+'.png',fullPage:true});

    await page.getByRole('button',{name:'Guest menu',exact:true}).click();
    await expect(page.locator('.dinerHeader')).toBeVisible();
    await expect(page.getByText('Important food allergy information')).toBeVisible();
    await page.screenshot({path:'test-results/visual/guest-'+captureName+'.png',fullPage:true});
    const customerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(customerOverflow,'Diner view must not scroll sideways').toBeLessThanOrEqual(2);
  });
}
