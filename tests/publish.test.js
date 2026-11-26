import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publishProject} from '../src/publish.js';
import {starterProject} from '../public/lib/site.js';
test('publishing uploads only the project Worker and enables its URL',async()=>{
 const original=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({success:true,result:url.endsWith('/workers/subdomain')?{subdomain:'studio-account'}:{}});};
 try{const result=await publishProject({CLOUDFLARE_ACCOUNT_ID:'account',CLOUDFLARE_API_TOKEN:'test-token'},'1234567890abcdef',starterProject());assert.equal(result.url,'https://np-site-1234567890abcdef.studio-account.workers.dev');assert.equal(calls.length,3);assert.equal(calls[0].options.method,'PUT');assert.ok(calls[0].options.body instanceof FormData);assert.equal(calls[0].options.body.get('site.mjs').type,'application/javascript+module');assert.ok(calls.every(x=>!x.url.includes('/zones/')));}finally{globalThis.fetch=original;}
});
test('publishing surfaces upstream rejection without reporting success',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({success:false,errors:[{message:'permission denied'}]},{status:403});try{await assert.rejects(()=>publishProject({CLOUDFLARE_ACCOUNT_ID:'a',CLOUDFLARE_API_TOKEN:'t'},'1234567890abcdef',starterProject()),/permission denied/);}finally{globalThis.fetch=original;}});
