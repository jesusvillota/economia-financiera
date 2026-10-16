/** PS4 acceptance: solve a full exercise, reroll it, reveal all maths, and check reciprocal links. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';
const server = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  for (const theme of ['dark','light']) {
    const context = await browser.newContext({viewport:{width:360,height:800}});
    await context.addInitScript(t=>localStorage.setItem('theme',t),theme);
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const slug='04-mercados-bonos-derivados';
    const response=await page.goto(`${server.base}sesiones/${slug}/`,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    assert.equal(await page.locator('h1').textContent(),'Mercados, bonos y derivados');
    assert.equal(await page.locator('.ses-exercise').count(),12);
    assert.deepEqual(await page.locator('.ses-exercise h2').allTextContents(),Array.from({length:12},(_,i)=>`Ejercicio ${i+1}`));
    const ex=page.locator('.ses-exercise').first();
    await ex.locator('input').first().waitFor();
    for(let i=1;i<=3;i++){
      await ex.getByRole('button',{name:new RegExp(`^Pista ${i}`)}).click();
      assert.equal(await ex.locator('.ses-hints li').count(),i);
    }
    const forms=ex.locator('.ses-answer');
    await forms.first().locator('input').fill('999');
    await forms.first().getByRole('button',{name:'Comprobar'}).click();
    assert.match(await forms.first().getByTestId('feedback').textContent(),/No es correcto/);
    const initial=400*35-4500, final=400*28-4500*1.09;
    const answers=[initial,100*initial/(400*35),final,100*final/(400*28),0,100*(final/initial-1),-20];
    assert.equal(await forms.count(),answers.length);
    for(let i=0;i<answers.length;i++){
      await forms.nth(i).locator('input').fill(answers[i].toFixed(6).replace('.',','));
      await forms.nth(i).getByRole('button',{name:'Comprobar'}).click();
      assert.match(await forms.nth(i).getByTestId('feedback').textContent(),/^Correcto/);
    }
    assert.match(await page.locator('.eyebrow').textContent(),/1 de 12 resueltos/);
    await page.reload({waitUntil:'networkidle'});
    assert.match(await page.locator('.eyebrow').textContent(),/1 de 12 resueltos/);
    // Open every hint and solution, including the repaired source 9c maths.
    for(const exercise of await page.locator('.ses-exercise').all()){
      while(await exercise.getByRole('button',{name:/^Pista \d/}).count())await exercise.getByRole('button',{name:/^Pista \d/}).click();
      await exercise.getByRole('button',{name:/Ver la solución/}).click();
      while(await exercise.getByRole('button',{name:'Siguiente paso',exact:true}).count())await exercise.getByRole('button',{name:'Siguiente paso',exact:true}).click();
      assert.doesNotMatch(await exercise.locator('.ses-steps').textContent(),/\{\{|extbf/);
    }
    assert.equal(await page.locator('.katex-error').count(),0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const before=await ex.locator('.ses-params dd').allTextContents();
    await ex.getByRole('button',{name:'Nueva variante'}).click();
    assert.notDeepEqual(await ex.locator('.ses-params dd').allTextContents(),before);
    assert.equal(await ex.locator('.ses-hints li').count(),0);
    assert.equal(await ex.locator('.ses-steps li').count(),0);
    assert.equal(await ex.getByTestId('feedback').count(),0);
    const param=async id=>Number((await ex.getByTestId(`param-${id}`).textContent()).replace(/[^\d,.-]/g,'').replace(',','.'));
    const target=await param('n')*await param('p0')-await param('loan');
    await forms.first().locator('input').fill(target.toFixed(4).replace('.',','));
    await forms.first().getByRole('button',{name:'Comprobar'}).click();
    assert.match(await forms.first().getByTestId('feedback').textContent(),/^Correcto/);
    const links=await page.getByRole('navigation',{name:'Capítulos de esta sesión'}).locator('a').evaluateAll(as=>as.map(a=>a.href));
    assert.equal(links.length,7);
    for(const href of links){
      await page.goto(href,{waitUntil:'networkidle'});
      assert.equal(await page.locator(`a[href$="/sesiones/${slug}/"]`).count()>0,true);
    }
    assert.deepEqual(errors,[]);
    console.log(`✓ ${theme} 360px: 3 hints, wrong answer, 7 correct answers, saved progress, seeded variant; all 12 solutions and 7 reciprocal chapter links clean`);
    await context.close();
  }
} finally {
  await browser?.close();
  await server.stop();
}
