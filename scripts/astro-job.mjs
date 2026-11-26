import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=process.env.STUDIO_URL||'https://editor.barnabasroadministries.org',id=process.env.DEPLOYMENT_ID,secret=process.env.BUILD_CALLBACK_SECRET;
if(!/^[a-f0-9-]{36}$/.test(id||'')||!secret)throw Error('Missing build identity or callback credential.');
const headers={Authorization:'Bearer '+secret,'Content-Type':'application/json'};
const runUrl=process.env.GITHUB_RUN_ID?`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:undefined;
async function status(value){const r=await fetch(`${base}/api/builds/${id}/status`,{method:'POST',headers,body:JSON.stringify({...value,runUrl})});if(!r.ok)throw Error('Studio rejected build status ('+r.status+').');}
const action=process.argv[2];
if(action==='prepare'){
 const r=await fetch(`${base}/api/builds/${id}/snapshot`,{headers});if(!r.ok)throw Error('Could not read the saved revision ('+r.status+').');const job=await r.json();
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/astro-job.json',JSON.stringify(job),{mode:0o600});fs.writeFileSync('website/project.json',JSON.stringify(job.project));
 await status({status:'building'});console.log('Saved revision '+job.revision+' received. Building website.');
}else if(action==='deploy'){
 const job=JSON.parse(fs.readFileSync('artifacts/astro-job.json'));if(!/^[a-z][a-z0-9-]{0,62}$/.test(job.config.workerName)||!/^[a-f0-9]{32}$/.test(job.config.accountId))throw Error('Invalid deployment destination.');
 fs.writeFileSync('website/wrangler.deploy.json',JSON.stringify({name:job.config.workerName,account_id:job.config.accountId,compatibility_date:'2026-11-05',workers_dev:true,preview_urls:false,assets:{directory:'./dist',not_found_handling:'404-page'}}));
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','website/wrangler.deploy.json'],{env:{...process.env,CLOUDFLARE_ACCOUNT_ID:job.config.accountId,CLOUDFLARE_API_TOKEN:job.config.token,CI:'true',WRANGLER_SEND_METRICS:'false'},stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
 await status({status:'published',url:job.config.url});console.log('Website published: '+job.config.url);
}else if(action==='failed'){await status({status:'failed'});}else throw Error('Unknown build action.');
