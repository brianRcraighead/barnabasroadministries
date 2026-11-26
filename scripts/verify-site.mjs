import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const project=JSON.parse(fs.readFileSync('website/project.json','utf8'));
const hash=createHash('sha256').update(JSON.stringify(project)).digest('hex');
for(const page of project.pages){const path='website/dist/'+(page.path==='/'?'':page.path.slice(1))+'index.html';const html=fs.readFileSync(path,'utf8');assert.ok(html.includes(`name="studio-content-hash" content="${hash}"`),'Built page does not match saved project: '+page.path);assert.ok(!html.includes('<script'),'Public site unexpectedly includes visitor JavaScript.');}
assert.ok(fs.existsSync('website/dist/404.html'));
console.log('Verified '+project.pages.length+' generated pages against the immutable content snapshot.');
