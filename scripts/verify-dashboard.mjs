import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ts = (path) => readFileSync(path, 'utf8');
const extract = (file, prefix) => {
  const content = ts(file);
  const start = content.indexOf(prefix);
  assert(start >= 0, 'Missing export ' + prefix);
  const raw = content.slice(start + prefix.length);
  assert(raw[0] === '"', 'Export must contain a JSON string literal');
  let escaped = false;
  for (let i = 1; i < raw.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (raw[i] === '\\') { escaped = true; continue; }
    if (raw[i] === '"') return JSON.parse(raw.slice(0, i + 1));
  }
  throw new Error('Unterminated JSON string in ' + file);
};
const css = extract('src/ui-wow-css.ts', 'export const WOW_CSS = ');
const addon = extract('src/ui-wow-js.ts', 'export const WOW_JS = ');
const htmlBase = extract('src/ui.ts', 'export const HTML: string = ');
assert(htmlBase.includes('</style>'), 'HTML is missing style tag');
assert(htmlBase.includes('\ninit();\n})();'), 'HTML init hook is missing');
assert(addon.includes('function renderOverview()'), 'Missing enhanced overview renderer');
const html = htmlBase.replace('</style>', css + '\n</style>')
  .replace('\ninit();\n})();', '\n' + addon + '\ninit();\n})();');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert(match?.[1], 'Inline JavaScript is missing');
new vm.Script(match[1], { filename: 'mcpgsc-dashboard.js' });
for (const name of ['metric-tabs','overview-main','movers-list','contribution-row','wow-chart']) {
  assert(html.includes(name), 'Required dashboard component missing: ' + name);
}
const inlineCss = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(inlineCss && inlineCss.includes('@media(max-width:760px)'), 'Missing mobile layout');
console.log('Dashboard syntax, UI widgets and mobile styles: OK');
