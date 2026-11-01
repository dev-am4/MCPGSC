import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const content = readFileSync('src/ui.ts','utf8');
const match = content.match(/export const HTML: string = ("(?:\\.|[^"\\])*")/);
assert(match?.[1],'ui.ts HTML string is missing');
let html = JSON.parse(match[1])
  .replaceAll('__MCPGSC_LOGO__','data:image/png;base64,TESTLOGO')
  .replaceAll('__MCPGSC_FAVICON__','data:image/png;base64,TESTFAV');

const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(js,'inline dashboard script is missing');
new vm.Script(js,{filename:'mcpgsc-dashboard.js'});

for(const required of [
  'Search performance',
  'เว็บไซต์ทั้งหมด',
  'class="metrics"',
  'class="chart"',
  'class="surface-list"',
  'data:image/png;base64,TESTLOGO',
  'data:image/png;base64,TESTFAV'
]) assert(html.includes(required),'missing clean dashboard element: '+required);

for(const removed of ['TRAFFIC SHARE','PERIOD COMPARISON','wow-metrics','overview-main','metric-spark'])
  assert(!html.includes(removed),'premium clutter still present: '+removed);

assert(html.includes('@media(max-width:760px)'),'mobile layout missing');

const brand = readFileSync('src/brand-inline.ts','utf8');
assert(brand.includes('data:image/png;base64,'),'embedded brand artwork is missing');
console.log('Clean dashboard syntax, embedded branding and mobile layout: OK');
