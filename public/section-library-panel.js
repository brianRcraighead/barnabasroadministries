import {sectionLibrary,libraryBlock} from './lib/section-library.js';
import {esc} from './lib/site.js';
export function mountSectionLibrary(root,onInsert){
 let target,returnFocus;
 root.innerHTML=`<header><div><h2>Section library</h2></div><button type="button" data-close aria-label="Close section library">×</button></header><div class="library-filters"><label>Search sections<input type="search" data-search placeholder="Try donation, FAQ, or photo"></label><label>Section category<select data-category><option value="">All sections</option></select></label></div><div class="library-cards" data-cards></div><p data-empty hidden>No matching sections. Try another search.</p>`;
 const cards=root.querySelector('[data-cards]'),search=root.querySelector('[data-search]'),category=root.querySelector('[data-category]');
 for(const name of [...new Set(sectionLibrary.map(s=>s.category))])category.add(new Option(name,name));
 const close=()=>{root.hidden=true;returnFocus?.focus();};
 function draw(){const query=search.value.toLowerCase().trim(),items=sectionLibrary.filter(s=>(!category.value||s.category===category.value)&&(!query||(s.id+' '+s.name+' '+s.description+' '+s.category).toLowerCase().includes(query)));cards.replaceChildren();for(const item of items){const card=document.createElement('article');card.className='library-card';card.draggable=true;card.dataset.template=item.id;card.innerHTML=`<div class="library-card-copy"><span>${esc(item.category)}</span><h3>${esc(item.name)}</h3><button type="button" aria-label="Insert ${esc(item.name)}">Insert section</button></div>`;card.querySelector('button').onclick=()=>{onInsert(libraryBlock(item.id),target);close();};card.ondragstart=e=>{e.dataTransfer.setData('application/x-poh-section',JSON.stringify({kind:'template',id:item.id}));e.dataTransfer.effectAllowed='copy';root.classList.add('library-dragging');};card.ondragend=()=>root.classList.remove('library-dragging');cards.append(card);}root.querySelector('[data-empty]').hidden=!!items.length;}
 search.oninput=draw;category.onchange=draw;root.querySelector('[data-close]').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){e.preventDefault();close();}});
 return {open(index){target=index;returnFocus=document.activeElement;root.hidden=false;draw();search.focus();},close};
}
