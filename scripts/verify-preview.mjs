// Menu Clear preview smoke checks; runs before every Vite production build.
// Protects the approved no-animation, photography-led design from regressions.
import {readFileSync, existsSync} from 'node:fs';
import assert from 'node:assert/strict';

const privateEntry = existsSync('src/PreviewApp.jsx');
const entryPath = privateEntry ? 'src/PreviewApp.jsx' : 'src/main.jsx';
const stylesheetPath = privateEntry ? 'src/preview.css' : 'src/styles.css';
const entry = readFileSync(entryPath,'utf8');
const css = readFileSync(stylesheetPath,'utf8');
const html = readFileSync('index.html','utf8');

function requirePart(value,label){ assert(entry.includes(value),label+' missing from actual React source'); }
assert(html.includes('<div id="root">'), 'Root container missing from HTML');
assert(entry.includes("import './"+stylesheetPath.split('/').pop()+"'"), 'React entry stylesheet import must point to a real file');
requirePart('SignatureGallery onCustomer', 'Restaurant photography gallery');
requirePart('className="welcomePanelCopy"', 'Bounded hero text column');
requirePart('className="welcomePanelMedia"', 'Independent hero photo column');
requirePart('dinerHeroPhoto', 'Customer photograph hero');
requirePart('GalleryPhoto', 'Photo load and failure handling');
requirePart('Important food allergy information', 'Customer allergy warning');
requirePart('Cross-contact may occur', 'Cross-contact warning');
requirePart('Fictional restaurant and ingredient information', 'Visible demo-only disclaimer');
requirePart('Menu management', 'Business navigation');
assert((entry.match(/https:\/\/images\.unsplash\.com/g)??[]).length >= 8, 'Photo resources unexpectedly missing');
assert(!css.includes('@keyframes'), 'Animated keyframes forbidden');
for (const match of css.matchAll(/(?:animation|transition)\s*:\s*([^;}]+)/gi)){
  assert(/^none\b/i.test(match[1].trim()),'No CSS motion allowed: '+match[0]);
}
assert(css.includes('animation:none!important;transition:none!important'), 'Static-only interaction reset missing');
if (!privateEntry){
  const config = readFileSync('vite.config.js','utf8');
  assert(config.includes('/menu-clear-preview/'), 'GitHub Pages base path incorrect');
}

// Keep the premium system maintainable: avoid reverting to 40KB+ of duplicated overrides.
assert(css.length < 34000, 'Canonical CSS exceeds design-system complexity budget; refactor instead of stacking overrides.');
assert((css.match(/@import/g)??[]).length === 0, 'Use bundled local font assets instead of runtime @import requests.');
assert(entry.includes("@fontsource/instrument-serif/latin-400.css") && entry.includes("@fontsource/plus-jakarta-sans/latin-400.css"), 'Real self-hosted typography imports missing.');
assert(css.includes('--shadow-md') && css.includes('--stroke'), 'Shared elevation and border design tokens are required.');
assert(css.includes('grid-template-columns:minmax(0,1.18fr) minmax(0,.82fr)'), 'Hero must use bounded CSS grid columns.');
assert(!css.includes('.welcomePanel::before') && !css.includes('.welcomePanel::after'), 'Do not reintroduce overlapping CSS hero images.');
assert(css.includes('Instrument Serif') && css.includes('Plus Jakarta Sans'), 'Approved professional typography pairing is required.');
for(const selector of ['.globalHeader','.modeSwitch','.sidebarNav','.welcomePanel','.signatureGrid','.dishGrid','.dinerHeader','.safetyBanner']){
  assert(css.includes(selector), 'Required professional UI component missing: '+selector);
}
console.log('Menu Clear design smoke checks passed ('+(privateEntry?'private app':'public Safari preview')+').');
