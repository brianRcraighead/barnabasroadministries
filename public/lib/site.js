import {supportedThemeIds,ministryThemeCss} from './themes.js';
import {originalSiteCss,originalSiteShell} from './original-site-theme.js';
import {INTERNAL,resolveLink,visibleBlock,textVisible} from './editor-model.js';
import {canvasMarkup,canvasCss,validateCanvas,donationUrl,imageUrl} from './canvas.js';
import {tenantProject} from './tenant.js';
import {professionalCss} from './design.js';
import {legacyLookCss} from './legacy-look.js';
export const blockTypes = {
 image:'Photo', gallery:'Photo gallery', download:'Document link', list:'List', table:'Table', quote:'Quote', links:'Resource links', columns:'Text columns', canvas: 'Freeform canvas', notice: 'Visit information strip', split: 'Story & photo', service: 'Program details', faq: 'Questions & answers', social: 'Social updates',
 hero: 'Welcome / hero', text: 'Story / mission', programs: 'Programs & services',
 team: 'Team profiles', hours: 'Hours & location', volunteer: 'Volunteer invitation', donate: 'Donation invitation',
 events: 'Upcoming events', impact: 'Impact figures', partners: 'Community partners', contact: 'Contact'
};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value, image = false) {
 const s=String(value||'').trim();
 if (!s) return '';
 if(/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/media\/library\/[a-f0-9]{64}\.(?:webp|pdf)$/.test(s)&&(!image||s.endsWith('.webp')))return s;
 if (image && /^\/(?:media|_astro|uploads)\/[a-zA-Z0-9_./-]+$/.test(s)&&!s.includes('..')) return s;
 if (image && /^data:/.test(s)) return imageUrl(s);
 if(!image&&INTERNAL.test(s))return s;
 if (!image && (/^\/(?!\/)/.test(s) || /^#[a-z0-9_-]+$/i.test(s))) return s;
 try { const u=new URL(s); return (image ? ['https:'] : ['https:','mailto:','tel:']).includes(u.protocol) ? s : ''; } catch { return ''; }
}
export function validateProject(p) {
 if (!p || typeof p!=='object' || typeof p.name!=='string' || !p.name.trim() || p.name.length>120) throw new Error('Enter an organization name (up to 120 characters).');
 if (!Array.isArray(p.pages) || !p.pages.length || p.pages.length>30) throw new Error('Use between 1 and 30 pages.');
 const paths=new Set(), ids=new Set(),blockIds=new Set();
 for(const page of p.pages){
  if (!page || !/^[a-z0-9-]{1,60}$/.test(page.id) || ids.has(page.id)) throw new Error('Page IDs must be unique.'); ids.add(page.id);
  if (typeof page.title!=='string'||!page.title.trim()||page.title.length>120) throw new Error('Each page needs a title.');
  if (!/^\/(?:[a-z0-9-]+\/)*$/.test(page.path)||paths.has(page.path)) throw new Error('Use unique page paths such as / or /volunteer/.'); paths.add(page.path);
  if (!Array.isArray(page.blocks)||page.blocks.length>40) throw new Error('Use at most 40 sections per page.');
  for(const b of page.blocks){
   if (!b || !blockTypes[b.type]) throw new Error('Unknown section type.');
   if(b.id!==undefined){if(!/^[a-z0-9-]{1,80}$/i.test(b.id)||blockIds.has(b.id))throw new Error('Block identities must be unique.');blockIds.add(b.id);}
   if(b.hiddenText&&(!Array.isArray(b.hiddenText)||b.hiddenText.some(k=>!['title','text','eyebrow','caption','attribution'].includes(k))))throw new Error('Invalid hidden text.');
   if(b.rows&&(!Array.isArray(b.rows)||b.rows.length>50||b.rows.some(row=>!Array.isArray(row)||row.length>10||row.some(cell=>typeof cell!=='string'||cell.length>1000))))throw new Error('Use at most 50 table rows and 10 columns.');
   if(b.columns!==undefined&&![2,3,4].includes(b.columns))throw new Error('Choose 2, 3, or 4 columns.');
   if(b.imageFit&&!['cover','contain'].includes(b.imageFit))throw new Error('Invalid photo fit.');
   if(b.type==='canvas')validateCanvas(b);
   if(b.variant&&!['plain','feature','compact','tint','dark','yellow'].includes(b.variant))throw new Error('Choose a supported section style.');
   if(b.hiddenSocials&&(!Array.isArray(b.hiddenSocials)||b.hiddenSocials.length>10||b.hiddenSocials.some(url=>typeof url!=='string'||!/^https:\/\//.test(url)||!safeUrl(url))))throw new Error('Hidden social links must be HTTPS URLs.');
   if(b.secondaryHref&&!safeUrl(b.secondaryHref))throw new Error('Secondary link needs a safe destination.');
   if(b.anchor&&!/^[a-z][a-z0-9-]{0,60}$/.test(b.anchor))throw new Error('Section anchors need a short lowercase name.');
   for(const item of b.items||[]){if(item.hiddenText&&(!Array.isArray(item.hiddenText)||item.hiddenText.some(key=>!['title','text'].includes(key))))throw new Error('Invalid hidden item text.');if(item.image&&(!safeUrl(item.image,true)||!item.alt?.trim()))throw new Error('Profile images need a safe URL and alt text.');if(item.linkLabel!==undefined&&(typeof item.linkLabel!=='string'||item.linkLabel.length>100))throw new Error('Card link labels must be short text.');if(item.href&&!safeUrl(item.href))throw new Error('Card link must be a safe destination.');}
   for(const key of ['title','text','eyebrow','button','href','image','alt','secondaryButton','secondaryHref','caption','attribution']) if (b[key]!==undefined && (typeof b[key]!=='string'||b[key].length>12000)) throw new Error('Section text is too long or invalid.');
   if (b.href && !safeUrl(b.href)) throw new Error('Links must use HTTPS, email, phone, or a local path.');
   if (b.image && (!safeUrl(b.image,true)||!b.alt?.trim())) throw new Error('Images need an HTTPS address and descriptive alt text.');
   if (b.items!==undefined && (!Array.isArray(b.items)||b.items.length>30||b.items.some(x=>typeof x.title!=='string'||typeof x.text!=='string'||x.title.length>300||x.text.length>12000))) throw new Error('Section cards need a title and text (up to 30 cards).');
  }
 }
 if(!paths.has('/')) throw new Error('Include a homepage at /.');
 if(p.donation?.url&&!donationUrl(p.donation))throw new Error('Donation link must match PayPal, Givebutter, Donorbox, or Stripe.');
 if(p.layout&&!['sidebar','header'].includes(p.layout))throw new Error('Choose a sidebar or header layout.');
 if(p.logo&&!safeUrl(p.logo,true))throw new Error('Logo needs a safe image URL.');
 if(p.socials&&(!Array.isArray(p.socials)||p.socials.length>10||p.socials.some(s=>typeof s.label!=='string'||s.label.length>80||!/^https:\/\//.test(s.url||'')||!safeUrl(s.url))))throw new Error('Social links need a label and an HTTPS URL.');
 if(p.domain && !/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(p.domain)) throw new Error('The canonical domain must be an HTTPS origin.');
 if(p.theme && !supportedThemeIds.includes(p.theme)) throw new Error('Choose a supported color palette.');
 return p;
}
export function starterProject(){return tenantProject();}
export const siteCss=professionalCss;
export function renderSection(source,project,options={}){
 const b=visibleBlock(source),link=value=>safeUrl(resolveLink(value,project));
 if(b.type==='canvas')return `<section class="canvas-section">${canvasMarkup(b,project)}</section>`;
 const primary=b.type==='donate'?donationUrl(project.donation):link(b.href);
 const buttons=(primary&&b.button?`<a class="button" href="${esc(primary)}"${b.type==='download'?' download="'+esc(b.downloadName||'document.pdf')+'"':''}>${esc(b.button)}</a>`:'')+(link(b.secondaryHref)&&b.secondaryButton?`<a class="button button-secondary" href="${esc(link(b.secondaryHref))}">${esc(b.secondaryButton)}</a>`:'');
 const titleTag=options.pageHeading?'h1':'h2';
 let content=b.items?.length?`<div class="cards">${b.items.map(i=>`<article class="card">${safeUrl(i.image,true)?`<img src="${esc(i.image)}" alt="${esc(i.alt)}" loading="lazy" width="400" height="480">`:''}<div class="card-copy"><h3>${esc(i.title)}</h3>${i.text?`<p>${esc(i.text)}</p>`:''}${link(i.href)?`<a class="card-link" href="${esc(link(i.href))}">${esc(i.linkLabel||'Learn more')}<span class="sr-only"> · ${esc(i.title)}</span></a>`:''}</div></article>`).join('')}</div>`:'';
 if(b.type==='faq')content=`<div class="faq-list">${(b.items||[]).map(i=>`<details><summary>${esc(i.title)}<span aria-hidden="true">+</span></summary><p>${esc(i.text)}</p></details>`).join('')}</div>`;
 if(b.type==='social')content=`<div class="social-actions">${(project.socials||[]).filter(i=>!b.hiddenSocials?.includes(i.url)).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.label)}</a>`).join('')}</div>`;
 if(b.type==='gallery')content=`<div class="photo-gallery">${(b.items||[]).filter(i=>safeUrl(i.image,true)).map(i=>`<figure><img src="${esc(i.image)}" alt="${esc(i.alt)}" loading="lazy" width="800" height="600">${i.text?`<figcaption>${esc(i.text)}</figcaption>`:''}</figure>`).join('')}</div>`;
 if(b.type==='list')content=`<${b.ordered?'ol':'ul'} class="content-list">${(b.items||[]).map(i=>`<li>${esc(i.title)}</li>`).join('')}</${b.ordered?'ol':'ul'}>`;
 if(b.type==='table')content=`<div class="table-scroll"><table>${(b.rows||[]).map((row,r)=>`<tr>${row.map(cell=>`<${r===0?'th':'td'}>${esc(cell)}</${r===0?'th':'td'}>`).join('')}</tr>`).join('')}</table></div>`;
 if(b.type==='quote')content=`<blockquote>${esc(b.text)}</blockquote>${b.attribution?`<cite>${esc(b.attribution)}</cite>`:''}`;
 if(b.type==='links')content=`<ul class="resource-links">${(b.items||[]).map(i=>`<li>${link(i.href)?`<a href="${esc(link(i.href))}">${esc(i.title)}</a>`:esc(i.title)}${i.text?`<p>${esc(i.text)}</p>`:''}</li>`).join('')}</ul>`;
 const image=safeUrl(b.image,true)?`<figure class="section-image"><img src="${esc(b.image)}" alt="${esc(b.alt)}" width="1000" height="750" style="object-fit:${b.imageFit||'cover'}" ${b.type==='hero'?'fetchpriority="high"':'loading="lazy"'}>${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:''}</figure>`:'';
 return `<section${b.anchor||b.id?` id="${esc(b.anchor||'block-'+b.id)}"`:''} class="section ${esc(b.type)} variant-${esc(b.variant||'plain')}${image?' has-image':''}${b.type==='columns'?' columns-'+(b.columns||2):''}"><div class="section-copy">${b.eyebrow?`<p class="eyebrow">${esc(b.eyebrow)}</p>`:''}${b.title?`<${titleTag}>${esc(b.title)}</${titleTag}>`: ''}${b.text&&b.type!=='quote'?`<p class="section-description">${esc(b.text)}</p>`:''}${buttons?`<div class="section-actions">${buttons}</div>`:''}${content}</div>${image}</section>`;
}
export function renderPage(project,page){
 const socials=(project.socials||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join('');
 const body=page.blocks.map((b,index)=>renderSection(b,project,{pageHeading:index===0})).join('');
 const original=project.theme==='original-site'?originalSiteShell(project,page,esc):null;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)} | ${esc(project.name)}</title><meta name="description" content="${esc(page.description||project.tagline||'')}">${project.domain?`<link rel="canonical" href="${esc(project.domain.replace(/\/$/,'')+page.path)}">`:''}<style data-site-style>${professionalCss}${canvasCss}${project.theme==='legacy-wordpress'?legacyLookCss:''}${original?originalSiteCss:''}${ministryThemeCss(project.theme)}</style></head><body class="${esc(project.theme||'green')} ${ministryThemeCss(project.theme)?'ministry-theme ':''}${project.layout==='sidebar'?'site-sidebar-layout':''}"><a class="skip" href="#main">Skip to content</a>${original?.header||`<header class="site-header"><a class="brand" href="/">${project.logo?`<img class="site-logo" src="${esc(project.logo)}" alt="${esc(project.name)} emblem" width="512" height="279"><span class="brand-name">${esc(project.name)}</span>`:esc(project.name)}</a><p class="site-tagline">${esc(project.tagline)}</p><nav aria-label="Main navigation">${project.pages.filter(p=>!p.hidden).map(p=>`<a href="${esc(p.path)}"${p.id===page.id?' aria-current="page"':''}>${esc(p.title)}</a>`).join('')}</nav><div class="social-links" aria-label="Social media">${socials}</div></header>`}<main id="main">${body}</main>${original?.footer||`<footer class="site-footer"><div><strong>${esc(project.name)}</strong><p>${esc(project.footer||'')}</p></div><div class="social-links" aria-label="Follow us">${socials}</div></footer>`}</body></html>`;
}
export function exportFiles(project){
 validateProject(project);
 const files=Object.fromEntries(project.pages.map(p=>[(p.path==='/'?'':p.path.slice(1))+'index.html',renderPage(project,p)]));
 files['404.html']='<!doctype html><html lang="en"><title>Page not found</title><h1>Page not found</h1><a href="/">Return home</a></html>';
 files['robots.txt']=`User-agent: *\nAllow: /\n${project.domain?'Sitemap: '+project.domain.replace(/\/$/,'')+'/sitemap.xml':''}\n`;
 if(project.domain)files['sitemap.xml']=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${project.pages.map(p=>`<url><loc>${esc(project.domain.replace(/\/$/,'')+p.path)}</loc></url>`).join('')}</urlset>`;
 return files;
}
