import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import * as lib from '../src/lib/sesion04';
import { rng, variant, withinTolerance, interpolate } from '../src/lib/problems/variant';
import { sessionSchema } from '../src/schemas/problem-session';
const slug = '04-mercados-bonos-derivados';
const fm = sessionSchema.parse(parse(readFileSync(`src/content/sesiones/${slug}.mdx`, 'utf8').split('---')[1]));
const call = (fn: string, args: number[]) => (lib as Record<string, (...x: number[]) => number>)[fn](...args);
// Independent cash-flow arithmetic. Newton in log(1+y) checks the library's bisection.
const root = (times: number[], amounts: number[], price: number) => {
  let z = .05;
  for (let i=0;i<100;i++) {
    const pv = amounts.map((a,j)=>a*Math.exp(-z*times[j]));
    const error = pv.reduce((a,b)=>a+b,0)-price;
    if (Math.abs(error)<1e-9) break;
    z += error/pv.reduce((s,v,j)=>s+times[j]*v,0);
  }
  return Math.expm1(z);
};
const fill = (size: number, prices: number[], sizes: number[]) => {
  let total=0, remaining=size;
  for(let i=0;i<prices.length;i++){const n=Math.min(remaining,sizes[i]);total+=n*prices[i];remaining-=n;}
  expect(remaining).toBe(0);
  return total;
};
const quote = (n: number, sell: number) => sell ? fill(n,[99.2,99,98.75,98.4],[100000,150000,200000,150000])/n : fill(n,[101,101.2,101.5,102],[150000,150000,200000,100000])/n;
const payment = (n: number, c: number, sell: number) => n*quote(n,sell)/100+n*c/400*(sell?2/3:1/3);
const flows = (face: number,c: number,t: number) => Array.from({length:t},(_,i)=>face*c/100+(i===t-1?face:0));
const refs: Record<string,(...a:number[])=>number> = {
 compra: (k,n,p,l,q,r) => { const e=n*p-l, final=n*q-l*(1+r/100);return [e,100*e/(n*p),final,100*final/(n*q),100*(final/e-1),100*(q/p-1)][k]; },
 llamadaCompra: (n,p,l,q,r,m) => Number(refs.compra(3,n,p,l,q,r)<m),
 corto: (k,n,p,m,q,d) => {const start=n*p*m/100,final=n*p+start-n*d-n*q;return [n*p,start,final,100*final/(n*q),100*(final/start-1)][k];},
 llamadaCorto: (n,p,m,q,d,maintenance) => Number(refs.corto(3,n,p,m,q,d)<maintenance),
 orden: (k,n,r) => {const total=fill(n,[62.3,63.1,64,65.5],[200,300,400,600]);return [.5,300,total/n,total,total-n*r,100*(total-n*r)/(n*r)][k];},
 evento: (k,b,o,m) => k ? o-b*m : b*m,
 car: (b,a,c,d) => a+c+d-b*(3+1-2),
 precioBono: (f,c,t,r1,rT) => flows(f,c,t).reduce((s,a,i)=>s+a/(1+(r1+(rT-r1)*i/(t-1))/100)**(i+1),0),
 tirBono: (f,c,t,p) => 100*root(Array.from({length:t},(_,i)=>i+1),flows(f,c,t),p),
 duracion: (f,c,t,p) => {const y=refs.tirBono(f,c,t,p)/100;return flows(f,c,t).reduce((s,a,i)=>s+(i+1)*a/(1+y)**(i+1),0)/p;},
 pvFinal: (f,c,t,r) => f*(1+c/100)/(1+r/100)**t,
 spotNuevo: (r,f,t) => 100*(((1+r/100)*(1+f/100)**(t-1))**(1/t)-1),
 precioNuevo: (face,c,t,r,f) => flows(face,c,t).reduce((s,a,i)=>s+a/((1+r/100)*(1+f/100)**i),0),
 forward: (a,b,c,d,e,s,k) => {const rates=[0,a,b,c,d,e];return 100*(((1+rates[s+k]/100)**(s+k)/(1+rates[s]/100)**s)**(1/k)-1);},
 precioLibro: quote,
 corrido: (f,c,fraction) => f*c/400*fraction,
 efectivo: payment,
 tirVencimiento: (n,c) => 100*root(Array.from({length:12},(_,i)=>(2+3*i)/12),Array.from({length:12},(_,i)=>n*c/400+(i===11?n:0)),payment(n,c,0)),
 tirVenta: (n,c) => 100*root([1/6,1/3],[n*c/400,payment(n,c,1)],payment(n,c,0)),
 cotizacion: (s,r,t) => s*(1+r/100)**t,
 descuento: (r,t) => (1+r/100)**(-t),
 valorForward: (s,k,r,t) => s-k/(1+r/100)**t,
 beneficioCall: (s,k,c) => Math.max(s-k,0)-c,
 beneficioAmbas: (s,k,c,p) => Math.abs(s-k)-c-p,
 futuros: (field,p0,p1,p2,p3,n,q,initial,maintenance) => {
  let balance=initial;const rows:number[]=[];const prices=[p0,p1,p2,p3];
  for(let i=1;i<4;i++){const gain=(prices[i]-prices[i-1])*n*q;balance+=gain;const topup=balance<maintenance?initial-balance:0;balance+=topup;rows.push(gain,topup,balance);}
  return [...rows,(p3-p0)*n*q][field];
 },
};
Object.assign(refs, {
 precioCompra: (n: number) => quote(n,0), precioVenta: (n: number) => quote(n,1),
 corridoCompra: (n: number,c: number) => n*c/1200, corridoVenta: (n: number,c: number) => n*c/600,
 desembolso: (n: number,c: number) => payment(n,c,0), cobro: (n: number,c: number) => payment(n,c,1),
 forward11: (...a: number[]) => refs.forward(...a,1,1),
 forward21: (...a: number[]) => refs.forward(...a,2,1),
 forward12: (...a: number[]) => refs.forward(...a,1,2),
});
const reference = (fn:string,args:number[]) => {
 const m=fn.match(/^(.*)_(\d+)$/);
 return m?refs[m[1]](Number(m[2]),...args):refs[fn](...args);
};
describe('PS4: all exercises and independent calculations across 20 random seeds',()=>{
 it('keeps every source exercise, closes numbering gaps, and adds futures',()=>{
  expect(fm.number).toBe(4);expect(fm.source).toBe('ps4');
  expect(fm.exercises.map(e=>e.id)).toEqual(['ej1','ej2','ej3','ej4','ej6','ej6_curva','ej8','ej9_compra','ej9_venta','ej10_forward','ej10_opciones','futuros']);
  expect(fm.exercises.flatMap(e=>e.answers)).toHaveLength(65);
 });
 it('links all seven chapters in both directions',()=>{
  expect(fm.chapters).toEqual(['11-mas-alla-capm','13-negociacion','17-bonos','18-estructura-temporal','19-duracion','20-forwards-futuros','21-opciones']);
  for(const chapter of fm.chapters){const data=parse(readFileSync(`src/content/chapters/${chapter}.mdx`,'utf8').split('---')[1]);expect(data.sessions).toContain(slug);}
  for(const ex of fm.exercises){expect(ex.concepts.length).toBeGreaterThan(0);for(const c of ex.concepts)expect(fm.chapters).toContain(c);}
 });
 it('PS4 Ex 9 solution replaces the malformed source conclusion command',()=>{
  const sale = fm.exercises.find(e=>e.id==='ej9_venta')!;
  const solution = sale.steps.map(s=>s.body).join('\n');
  expect(solution).not.toMatch(/extbf/);
  expect(solution).toContain('8,14');
 });
 for(const ex of fm.exercises){
  const defaults=Object.fromEntries(ex.parameters.map(p=>[p.id,p.default]));
  it(`${ex.id}: hints, ranges, steps and resolved placeholders`,()=>{
   expect(ex.hints.length).toBeGreaterThanOrEqual(2);expect(ex.hints.length).toBeLessThanOrEqual(3);expect(ex.steps.length).toBeGreaterThanOrEqual(2);
   expect(ex.parameters.some(p=>p.min!==undefined&&p.max!>p.min)).toBe(true);
   for(const p of ex.parameters)if(p.min!==undefined){expect(p.default).toBeGreaterThanOrEqual(p.min);expect(p.default).toBeLessThanOrEqual(p.max!);}
   const values={...defaults,...Object.fromEntries(ex.answers.map(a=>[a.id,a.value]))};
   for(const text of [ex.statement,...ex.hints,...ex.steps.map(s=>s.body)])expect(interpolate(text,values)).not.toMatch(/\{\{/);
  });
  for(const a of ex.answers){
   it(`${ex.id}.${a.id}: defaults vs library, frontmatter and independent arithmetic`,()=>{
    expect(a.lib.module).toBe('sesion04');const args=a.lib.args.map(id=>defaults[id]);const actual=call(a.lib.fn,args);
    expect(actual).toBeCloseTo(reference(a.lib.fn,args),7);expect(withinTolerance(actual,a.value,a.tolerance)).toBe(true);
    if(a.unit === '%') expect(withinTolerance(Number(actual.toFixed(2)),actual,a.tolerance)).toBe(true);
   });
   it(`${ex.id}.${a.id}: 20 random seeded variants`,()=>{
    const random=rng(ex.seed);
    for(let i=0;i<20;i++){const seed=Math.floor(random()*2**32);const params=variant(ex.parameters,seed);expect(params).toEqual(variant(ex.parameters,seed));
     for(const p of ex.parameters)if(p.min!==undefined){expect(params[p.id]).toBeGreaterThanOrEqual(p.min);expect(params[p.id]).toBeLessThanOrEqual(p.max!);}
     const args=a.lib.args.map(id=>params[id]);const actual=call(a.lib.fn,args);expect(Number.isFinite(actual)).toBe(true);expect(actual).toBeCloseTo(reference(a.lib.fn,args),7);
    }
   });
  }
 }
 it('asserts corrected AUDIT values for 6a, 8b, 9b/c and 10b with explicit rounding conventions',()=>{
  expect(lib.pvFinal(1000,5,2,3.5).toFixed(2)).toBe('980.19');
  expect(lib.precioBono(1000,5,2,3,3.5).toFixed(2)).toBe('1028.73');
  expect(lib.forward(3,3.5,4,4.2,4.3,2,1).toFixed(2)).toBe('5.01');
  expect(lib.precioLibro(350000,1).toFixed(2)).toBe('98.99');
  expect((lib.precioLibro(350000,1)*10).toFixed(2)).toBe('989.86');
  expect((lib.efectivo(350000,14.5,1)/350).toFixed(2)).toBe('1014.02');
  // AUDIT rounds clean and accrued components separately: 989.86 + 24.17 = 1014.03.
  expect(Number((lib.precioLibro(350000,1)*10).toFixed(2))+Number(lib.corrido(1000,14.5,2/3).toFixed(2))).toBeCloseTo(1014.03,10);
  expect((36.25**2+4*1023.68*1014.03).toFixed(0)).toBe('4153483');
  expect(lib.tirVencimiento(350000,14.5).toFixed(2)).toBe('14.76');
  expect(lib.tirVentaAuditada().toFixed(2)).toBe('8.14');
  expect((100*root([1/6,1/3],[36.25,lib.efectivo(350000,14.5,1)/350],1023.68)).toFixed(2)).toBe('8.14');
  expect(lib.tirVenta(350000,14.5).toFixed(2)).toBe('8.15');
  expect(lib.descuento(4,1.5).toFixed(4)).toBe('0.9429');
  expect((48*lib.descuento(4,1.5)).toFixed(2)).toBe('45.26');
  expect(lib.valorForward(50,48,4,1.5).toFixed(2)).toBe('4.74');
 });
 it('root finder works beyond the two-year quadratic and preserves source rounding comparisons',()=>{
  for(const years of [2,3,4,5]){const y=lib.tirBono(1000,5,years,1035)/100;expect(flows(1000,5,years).reduce((s,a,i)=>s+a/(1+y)**(i+1),0)).toBeCloseTo(1035,8);}
  expect(lib.precioNuevo(1000,0,2,3.5,4.5).toFixed(2)).toBe('924.58');
  expect(lib.precioNuevo(1000,5,2,3.5,4.5).toFixed(2)).toBe('1019.12');
  expect(lib.precioBono(1000,0,2,3.5,4).toFixed(2)).toBe('924.56');
  expect(lib.precioBono(1000,5,2,3.5,4).toFixed(2)).toBe('1019.09');
 });
 it('strict maintenance threshold does not call at equality',()=>{
  expect(lib.futuros_1(100,97.5,97.5,97.5,2,10,200,150)).toBe(0);
  expect(lib.futuros_1(100,97.49,97.49,97.49,2,10,200,150)).toBeGreaterThan(0);
 });
});
