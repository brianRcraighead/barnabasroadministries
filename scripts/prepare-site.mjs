import {prepareMedia} from './prepare-media.mjs';
import fs from 'node:fs';
import {loadBuildProject} from '../website/project.mjs';
import {exportFiles} from '../public/lib/site.js';
await prepareMedia();
fs.mkdirSync('website/public',{recursive:true});
const project=loadBuildProject();if(!fs.existsSync('website/project.json'))fs.writeFileSync('website/project.json',JSON.stringify(project));
const files=exportFiles(project);for(const name of ['robots.txt','sitemap.xml'])if(files[name])fs.writeFileSync('website/public/'+name,files[name]);
fs.writeFileSync('website/public/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n/uploads/*\n  Cache-Control: public, max-age=31536000, immutable\n/uploads/*.pdf\n  Content-Disposition: attachment\n`);
