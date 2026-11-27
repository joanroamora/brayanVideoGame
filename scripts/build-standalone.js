/**
 * Zero-dependency Standalone HTML Bundler for BRAYAN 16 BIT (Capítulo 1: Mundos 1-1 a 1-4 + Cinemáticas).
 * Inlines styles/main.css, all 39 16-bit assets (Base64), and all ES Modules in dependency order
 * into a single portable HTML file at dist/BRAYAN_16BIT_BOGOTA_COMPLETO.html.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(DIST_DIR, 'BRAYAN_16BIT_BOGOTA_COMPLETO.html');

// Ordered dependency list matching the ES module graph
const MODULE_ORDER = [
  'src/core/gameState.js',
  'src/config/i18n.js',
  'src/core/assets.js',
  'src/core/audio.js',
  'src/core/renderer.js',
  'src/core/ui.js',
  'src/core/stageManager.js',
  'src/core/input.js',
  'src/stages/titleStage.js',
  'src/stages/introCutsceneStage.js',
  'src/stages/world1_1/levelData.js',
  'src/stages/world1_1/world1_1Renderer.js',
  'src/stages/world1_1/world1_1Stage.js',
  'src/stages/world1_2/levelData.js',
  'src/stages/world1_2/world1_2Renderer.js',
  'src/stages/world1_2/world1_2Stage.js',
  'src/stages/cutscene1_2To1_3Stage.js',
  'src/stages/world1_3/levelData.js',
  'src/stages/world1_3/world1_3Renderer.js',
  'src/stages/world1_3/world1_3Stage.js',
  'src/stages/world1_4/levelData.js',
  'src/stages/world1_4/world1_4Renderer.js',
  'src/stages/world1_4/world1_4Stage.js',
  'src/stages/cutscene1_4To2_1Stage.js',
  'src/stages/world2_1/levelData.js',
  'src/stages/world2_1/world2_1Renderer.js',
  'src/stages/world2_1/world2_1Stage.js',
  'src/stages/cutscene2_1To2_2Stage.js',
  'src/stages/world2_2/levelData.js',
  'src/stages/world2_2/world2_2Renderer.js',
  'src/stages/world2_2/world2_2Stage.js',
  'src/stages/cutscene2_2To2_3Stage.js',
  'src/stages/world2_3/levelData.js',
  'src/stages/world2_3/world2_3Renderer.js',
  'src/stages/world2_3/world2_3Stage.js',
  'src/main.js'
];

// 1. Build inline Base64 ASSET_MANIFEST from src/core/assets.js
const assetsSrc = fs.readFileSync(path.join(ROOT, 'src/core/assets.js'), 'utf8');
const assetMap = {};
const pathRe = /(\w+)\s*:\s*['"](\.\/assets\/[^'"]+)['"]/g;
let m;
while ((m = pathRe.exec(assetsSrc)) !== null) {
  const key = m[1];
  const relPath = m[2].replace(/^\.\//, '');
  const fullPath = path.join(ROOT, relPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : 'image/png';
  assetMap[key] = `data:${mime};base64,${fs.readFileSync(fullPath).toString('base64')}`;
}
console.log(`Embedded ${Object.keys(assetMap).length} 16-bit assets as Base64.`);

// 2. Flatten ES Modules cleanly (strip import/export keywords & avoid duplicate local const collisions via IIFE namespaces where needed)
let combinedJs = '';
for (const rel of MODULE_ORDER) {
  let code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (rel === 'src/core/assets.js') {
    code = code.replace(/export const ASSET_MANIFEST = \{[\s\S]*?\};/, () => `const ASSET_MANIFEST = ${JSON.stringify(assetMap)};`);
  }
  // Remove ES import statements
  code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '');
  // Remove leading export keywords
  code = code.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/gm, '');

  // Isolate stage files that share helper names (addFloatText, spawnParticles, getOverlayConfig, GROUND_Y, etc.)
  const isStageModule = rel.startsWith('src/stages/') && !rel.endsWith('levelData.js') && !rel.endsWith('Renderer.js');
  if (isStageModule) {
    const stageVarMatch = code.match(/const\s+(titleStage|introCutsceneStage|cutscene1_2To1_3Stage|cutscene1_4To2_1Stage|cutscene2_1To2_2Stage|cutscene2_2To2_3Stage|world1_1Stage|world1_2Stage|world1_3Stage|world1_4Stage|world2_1Stage|world2_2Stage|world2_3Stage)\s*=/);
    if (stageVarMatch) {
      const stageVar = stageVarMatch[1];
      combinedJs += `\n// === ${rel} ===\nconst ${stageVar} = (() => {\n${code}\nreturn ${stageVar};\n})();\n`;
      continue;
    }
  }
  combinedJs += `\n// === ${rel} ===\n${code}\n`;
}

// Validate combined JS syntax!
new Function(combinedJs);
console.log('Standalone JS bundle syntax validation PASSED!');

// 3. Inline CSS & JS into index.html
const htmlTemplate = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'styles/main.css'), 'utf8');

let outHtml = htmlTemplate
  .replace('<link rel="stylesheet" href="./styles/main.css" />', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/main.js"></script>', () => `<script>\n(function() {\n'use strict';\n${combinedJs}\n})();\n</script>`);

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, outHtml, 'utf8');
console.log(`Built standalone single-file HTML: ${OUT_FILE} (${Math.round(fs.statSync(OUT_FILE).size / 1024)} KB)`);
