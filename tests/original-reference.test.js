import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {starterProject,validateProject,renderPage} from '../public/lib/site.js';
import {legacyLookProject} from '../public/lib/legacy-look.js';
import {referenceForPage,referenceTextHtml} from '../public/original-reference.js';
test('old look changes only appearance, preserves content, and exports without scripts',()=>{const p=starterProject(),before=structuredClone(p),restored=legacyLookProject(p);assert.deepEqual(p,before);assert.deepEqual(restored.pages,p.pages);assert.deepEqual(restored.donation,p.donation);assert.equal(restored.layout,'header');assert.equal(restored.theme,'legacy-wordpress');validateProject(restored);const html=renderPage(restored,restored.pages[0]);assert.ok(html.includes('.legacy-wordpress'));assert.doesNotMatch(html,/<script/);});
test('starter references match all neutral pages and escape comparison text',()=>{const data=JSON.parse(fs.readFileSync('public/references/restored/index.json'));for(const page of starterProject().pages)assert.ok(referenceForPage(page,data.pages));const html=referenceTextHtml({title:'<script>bad</script>',text:'<img src=x onerror=alert(1)>'});assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script|<img/);});
