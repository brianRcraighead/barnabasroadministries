import {featureProject as starterProject} from './fixtures/project.js';
import {resolveLink} from '../public/lib/editor-model.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inlineTarget,updateInlineText} from '../public/inline-editor.js';
import {exportFiles} from '../public/lib/site.js';

test('inline edits update section, card, and canvas text while refusing URL and invalid targets',()=>{
 const page={blocks:[{type:'hero',title:'Before',href:'/safe/',items:[{title:'Name',text:'Role'}]},{type:'canvas',layers:[{id:'text-layer',kind:'text',text:'Before'},{id:'photo',kind:'image',src:'https://example.com/photo.jpg'}]}]};
 assert.ok(updateInlineText(page,{section:0,field:'title'},'After'));
 assert.ok(updateInlineText(page,{section:0,item:0,field:'text'},'Line one\nLine two'));
 assert.ok(updateInlineText(page,{section:1,layer:'text-layer',field:'text'},'Canvas edit'));
 assert.equal(page.blocks[0].title,'After');assert.equal(page.blocks[0].items[0].text,'Line one\nLine two');assert.equal(page.blocks[1].layers[0].text,'Canvas edit');
 for(const address of [{section:0,field:'href'},{section:-1,field:'title'},{section:'__proto__',field:'text'},{section:0,item:'__proto__',field:'text'},{section:1,layer:'photo',field:'text'},{section:0,field:'__proto__'}])assert.equal(updateInlineText(page,address,'unsafe'),false);
 assert.equal(page.blocks[0].href,'/safe/');assert.equal(inlineTarget(page,0,'href'),null);
});
test('inline text remains escaped on publication and editor controls never enter exported pages',()=>{
 const project=starterProject();const page=project.pages[0];updateInlineText(page,{section:0,field:'title'},'<img src=x onerror=alert(1)>');const files=exportFiles(project);
 assert.match(files['index.html'],/&lt;img src=x onerror=alert\(1\)&gt;/);
 for(const html of Object.values(files))assert.doesNotMatch(html,/contenteditable|data-inline-|inline-editor\.js/);
 const itemPage={blocks:[{type:'team',items:[{title:'Name',text:''}]}]};updateInlineText(itemPage,{section:0,item:0,field:'title'},'x'.repeat(400));assert.equal(itemPage.blocks[0].items[0].title.length,300);
});
import {blockLinks,siteLinkOptions} from '../public/inline-editor.js';
test('link editing binds real destinations and offers every site page and section',()=>{
 const project=starterProject(),page=project.pages.find(p=>p.id==='programs');const links=blockLinks(project,page,1);assert.equal(links[0].target,page.blocks[1]);assert.equal(links[0].key,'href');links[0].target[links[0].key]='/team/';assert.match(exportFiles(project)['programs/index.html'],/href="\/team\/"/);
 const options=siteLinkOptions(project);for(const page of project.pages)assert.ok(options.some(option=>resolveLink(option.value,project)===page.path));assert.ok(options.some(option=>resolveLink(option.value,project)==='/programs/#food-pantry'));
 const donate=project.pages.find(p=>p.id==='donate');const giving=blockLinks(project,donate,0);assert.equal(giving[0].target,project.donation);assert.equal(giving[0].kind,'donation');
 for(const html of Object.values(exportFiles(project)))assert.doesNotMatch(html,/remove-preview-block|preview-block-tools|preview-link-fields/);
});

import {removeLinkElement} from '../public/inline-editor.js';
test('removing one button preserves its sibling and restores the original link with Undo',()=>{
 const project=starterProject(),page=project.pages[0],hero=page.blocks[0];const original={button:hero.button,href:hero.href};const undo=removeLinkElement(blockLinks(project,page,0)[0]);assert.equal(hero.button,undefined);assert.equal(hero.href,undefined);assert.equal(hero.secondaryButton,'Donate');const html=exportFiles(project)['index.html'];assert.ok(!html.includes('>Our programs</a>'));undo();assert.equal(hero.button,original.button);assert.equal(hero.href,original.href);
});
test('removing a donation button does not delete the organization checkout configuration',()=>{
 const project=starterProject(),page=project.pages.find(p=>p.id==='donate'),url=project.donation.url;const undo=removeLinkElement(blockLinks(project,page,0)[0]);assert.equal(page.blocks[0].button,undefined);assert.equal(project.donation.url,url);undo();assert.ok(page.blocks[0].button);
});
test('removing a social button affects only its section and Undo restores it',()=>{
 const project=starterProject(),page=project.pages.find(p=>p.id==='contact'),index=page.blocks.findIndex(b=>b.type==='social');const before=project.socials.length;const undo=removeLinkElement(blockLinks(project,page,index)[0]);assert.equal(project.socials.length,before);assert.equal(blockLinks(project,page,index).length,before-1);undo();assert.equal(blockLinks(project,page,index).length,before);
});
