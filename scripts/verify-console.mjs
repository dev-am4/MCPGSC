import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ui=readFileSync('src/ui.ts','utf8');
const up=readFileSync('src/ui-console-enhance.ts','utf8');
const google=readFileSync('src/google.ts','utf8');
const api=readFileSync('src/index.ts','utf8');
const original=ui.match(/export const HTML: string = ("(?:\\.|[^"\\])*")/);
assert(original?.[1], 'dashboard base HTML missing');
const html=JSON.parse(original[1]);
function upgradeString(name){
 const tick=String.fromCharCode(96);
 const match=up.match(new RegExp('export const '+name+' = String.raw'+tick+'([\\s\\S]*?)'+tick+';'));
 assert(match?.[1], name+' missing');
 return match[1];
}
const css=upgradeString('CONSOLE_CSS'),js=upgradeString('CONSOLE_JS');
const oldJs=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
assert(oldJs.includes('\ninit();\n})();'), 'bootstrap insertion point missing');
const merged=oldJs.replace('\ninit();\n})();','\n'+js+'\ninit();\n})();');
new vm.Script(merged,{filename:'mcpgsc-console-v2.js'});
assert(ui.includes("CONSOLE_CSS + '</style>'"),'dashboard CSS not wired');
assert(ui.includes('CONSOLE_SIDE_NAV'),'compact side navigation not wired');
assert(ui.includes('CONSOLE_NAV'),'topic tabs not wired');
assert(ui.includes("CONSOLE_JS +"),'dashboard JS not wired');
for(const phrase of ['function renderTrend','function renderSegments','function renderSitemaps',
 'function renderStrategy','function drawMetricChart','function exportConsole',
 'function loadView','function refresh','data-chart-metric','data-strategy-tab',
 'data-segment-dimension','data-export']){
 assert(js.includes(phrase),'missing dashboard feature: '+phrase);
}
assert(css.includes('height:100dvh'),'single-viewport height missing');
assert(css.includes('#content{flex:1;min-height:0;overflow:auto'),'internal scroll surface missing');
assert(js.includes('new Blob([csv]'),'CSV export missing');
assert(js.includes("if(/^[\\s]*[=+\\-@]/.test(s))"),'CSV injection defense missing');
assert(google.includes('export async function segmentRows'),'GSC segments backend missing');
assert(google.includes('export async function sitemapRows'),'GSC sitemap backend missing');
assert(google.includes("findSite(await listSites(env, email, token), property)"),'property authorization missing');
assert(google.includes('previousTimeline'),'previous-period time series missing');
for(const path of ['/api/segments','/api/sitemaps'])assert(api.includes(path),'missing authenticated endpoint '+path);
assert(api.includes("segment-v1:")&&api.includes("sitemap-v1:"),'cache invalidation incomplete');
assert(!merged.includes('DEMO_DATA'),'dashboard must not invent metrics');
console.log('MCPGSC compact SEO console, GSC dimensions, sitemap health and CSV: OK');

assert(google.includes("['metrics-v2', email, site.property"),'new chart payload must bypass stale metrics cache');
assert(api.includes("'metrics-v2:' + email + ':%'"),'refresh must clear chart cache');
