import {INTERNAL,resolveLink} from './editor-model.js';
// Portable canvas model shared by editing, preview, ZIP, and cloud publishing.
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
export const fonts={sans:'Arial, sans-serif',serif:'Georgia, serif',condensed:'Impact, "Arial Narrow", sans-serif',mono:'"Courier New", monospace'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function imageUrl(s){if(/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/media\/library\/[a-f0-9]{64}\.webp$/.test(s||''))return s;if(/^\/uploads\/[a-f0-9]{64}\.webp$/.test(s||''))return s;return /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s||'')||/^https:\/\//i.test(s||'')?s:'';}
export function linkUrl(s){if(INTERNAL.test(s||''))return s;if(/^\/(?!\/)/.test(s||'')||/^#[\w-]+$/.test(s||''))return s;try{return ['https:','mailto:','tel:'].includes(new URL(s).protocol)?s:'';}catch{return '';}}
export function newLayer(kind='text',extra={}){return {id:crypto.randomUUID(),kind,text:kind==='button'?'Learn more':kind==='text'?'Text':'',x:8,y:8,w:kind==='text'?60:kind==='button'?30:40,h:kind==='text'?25:kind==='button'?12:40,fontSize:kind==='text'?52:22,font:'sans',color:'#202020',background:kind==='shape'?'#f3cd32':kind==='button'?'#202020':'#ffffff',opaque:kind!=='text',bold:false,heading:0,align:'left',rotation:0,opacity:1,radius:0,fit:'cover',src:'',alt:'',href:'',...extra};}
export function newCanvas(extra={}){return {type:'canvas',title:'Freeform canvas',background:'#fffdf5',height:760,mobileMode:'stack',layers:[],...extra};}
export function validateCanvas(b){
 if(!/^#[0-9a-f]{6}$/i.test(b.background||'')||!Number.isFinite(b.height)||b.height<300||b.height>2000||!['stack','custom'].includes(b.mobileMode))throw new Error('Invalid canvas background, height, or mobile layout.');
 if(!Array.isArray(b.layers)||b.layers.length>80)throw new Error('Use at most 80 layers per canvas.');
 const ids=new Set();for(const l of b.layers){
  if(!l||typeof l.id!=='string'||!/^[a-z0-9-]{1,80}$/i.test(l.id)||ids.has(l.id)||!['text','image','shape','button'].includes(l.kind))throw new Error('Invalid or duplicate canvas layer.');ids.add(l.id);
  if(typeof l.text!=='string'||l.text.length>12000||!fonts[l.font]||!['left','center','right'].includes(l.align)||!['cover','contain'].includes(l.fit))throw new Error('Invalid layer text or formatting.');
  for(const c of [l.color,l.background])if(!/^#[0-9a-f]{6}$/i.test(c))throw new Error('Layer colors must be six-digit hex colors.');
  for(const [k,min,max] of [['fontSize',8,240],['rotation',-180,180],['opacity',0,1],['radius',0,100]])if(!Number.isFinite(l[k])||l[k]<min||l[k]>max)throw new Error('Layer style is outside its allowed range.');
  for(const g of [l,...(l.mobile?[l.mobile]:[])])if(!['x','y','w','h'].every(k=>Number.isFinite(g[k]))||g.x<0||g.y<0||g.w<2||g.h<2||g.x+g.w>100.05||g.y+g.h>100.05)throw new Error('Keep layers inside the canvas.');
  if(l.src&&(!imageUrl(l.src)||l.src.length>350000||!l.alt?.trim()))throw new Error('Images need HTTPS or a small PNG/JPEG/WebP upload and descriptive alt text.');
  if(l.href&&!linkUrl(l.href))throw new Error('Layer link is not a safe destination.');
  if(l.action&&!['donate'].includes(l.action))throw new Error('Unknown layer action.');
  if(l.heading!==undefined&&![0,1,2,3].includes(l.heading))throw new Error('Invalid heading level.');
 }
}
export function donationUrl(d){
 if(!d?.url)return '';
 try{const u=new URL(d.url);const allowed={paypal:['paypal.com','www.paypal.com'],givebutter:['givebutter.com','www.givebutter.com'],donorbox:['donorbox.org','www.donorbox.org'],stripe:['buy.stripe.com','donate.stripe.com']};return u.protocol==='https:'&&allowed[d.provider]?.includes(u.hostname)&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
export function layerMarkup(l,project={},editing=false,index=0){
 const g=l,m=l.mobile||l;
 const style=`left:${g.x}%;top:${g.y}%;width:${g.w}%;height:${g.h}%;--mx:${m.x}%;--my:${m.y}%;--mw:${m.w}%;--mh:${m.h}%;--font:${l.fontSize};font-size:${l.fontSize/12}cqw;font-family:${fonts[l.font]||fonts.sans};font-weight:${l.bold?700:400};text-align:${l.align};color:${l.color};background:${l.opaque?l.background:'transparent'};transform:rotate(${l.rotation}deg);opacity:${l.opacity};border-radius:${l.radius}px;z-index:${index+1};`;
 const href=l.action==='donate'?donationUrl(project.donation):linkUrl(resolveLink(l.href,project));
 const content=l.kind==='image'?(imageUrl(l.src)?`<img src="${escape(l.src)}" alt="${escape(l.alt)}" style="object-fit:${l.fit}" loading="lazy">`:'<span class="image-placeholder">Add an image</span>'):l.kind==='shape'?'':`<span${l.kind==='text'&&l.heading?` role="heading" aria-level="${l.heading}"`:''}>${escape(l.text)}</span>`;
 const inner=href&&!editing?`<a href="${escape(href)}"${l.action==='donate'?' aria-label="Donate securely with '+escape(project.donation?.provider)+'"':''}>${content}</a>`:content;
 return `<div class="canvas-layer kind-${l.kind}" data-layer-id="${escape(l.id)}" style="${escape(style)}"${editing?' tabindex="0" role="group" aria-label="'+escape(l.kind+' layer')+'"':''}>${inner}${editing?'<button type="button" class="layer-grip" aria-label="Resize layer">↘</button>':''}</div>`;
}
export function canvasMarkup(b,project={},editing=false){return `<div class="design-canvas ${editing?'editing ':''}mobile-${b.mobileMode}" style="--mobile-ink:${parseInt(b.background.slice(1,3),16)*.299+parseInt(b.background.slice(3,5),16)*.587+parseInt(b.background.slice(5,7),16)*.114>140?'#202020':'#ffffff'};--canvas-height:${b.height}px;background:${b.background};aspect-ratio:1200/${b.height}" aria-label="${escape(b.title||'Freeform design')}">${b.layers.map((l,i)=>layerMarkup(l,project,editing,i)).join('')}</div>`;}
export const canvasCss=`.canvas-section{max-width:1440px;margin:auto;padding:0}.design-canvas{position:relative;container-type:inline-size;isolation:isolate;overflow:hidden}.canvas-layer{position:absolute;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.12;overflow:hidden}.canvas-layer span{display:block}.canvas-layer a{display:block;width:100%;height:100%;color:inherit;text-decoration:none}.canvas-layer.kind-button>a,.canvas-layer.kind-button>span{display:flex;align-items:center;justify-content:center;width:100%;height:100%}.canvas-layer img{width:100%;height:100%;display:block}.image-placeholder{border:1px dashed #aaa;display:grid;place-items:center;height:100%;font:14px Arial;color:#777}.layer-grip{display:none}@media(max-width:650px){.design-canvas:not(.editing).mobile-stack{aspect-ratio:auto!important;padding:28px 6%;display:flex;flex-direction:column;gap:22px}.mobile-stack:not(.editing)>.canvas-layer{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:32px;font-size:clamp(18px,calc(var(--font)*.55px),60px)!important;transform:none!important}.mobile-stack:not(.editing)>.kind-text{color:var(--mobile-ink)!important;background:transparent!important}.mobile-stack:not(.editing)>.kind-shape{display:none}.mobile-stack:not(.editing)>.kind-image{height:260px!important}.mobile-stack:not(.editing)>.kind-button{height:56px!important}.design-canvas:not(.editing).mobile-custom{aspect-ratio:2/3!important}.mobile-custom:not(.editing)>.canvas-layer{left:var(--mx)!important;top:var(--my)!important;width:var(--mw)!important;height:var(--mh)!important;font-size:clamp(12px,calc(var(--font)*.5px),80px)!important}}`;
