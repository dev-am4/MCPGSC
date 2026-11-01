import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const content = readFileSync('src/ui.ts','utf8');
const prefix = 'export const HTML: string = ';
assert(content.startsWith(prefix),'ui.ts export is missing');
const raw = content.slice(prefix.length).trim().replace(/;$/,'');
const html = JSON.parse(raw);

const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(js,'inline dashboard script is missing');
new vm.Script(js,{filename:'mcpgsc-dashboard.js'});

for(const required of [
  'Search performance',
  'เว็บไซต์ทั้งหมด',
  'class="metrics"',
  'class="chart"',
  'class="surface-list"',
  '/generated-favicon.png?brand=global2'
]) assert(html.includes(required),'missing clean dashboard element: '+required);

for(const removed of ['TRAFFIC SHARE','PERIOD COMPARISON','wow-metrics','overview-main','metric-spark'])
  assert(!html.includes(removed),'premium clutter still present: '+removed);

assert(html.includes('@media(max-width:760px)'),'mobile layout missing');
console.log('Clean dashboard syntax, hierarchy, mobile layout and brand: OK');
