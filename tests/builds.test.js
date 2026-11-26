import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker from '../src/worker.js';
import {cookieFor} from '../src/auth.js';
import {starterProject} from '../public/lib/site.js';
import {sealConfig,openConfig} from '../src/settings.js';
test('queued Astro builds use immutable saved revisions and authenticated callbacks without leaking credentials',async()=>{
 const db=new DatabaseSync(':memory:');for(const file of ['0001_studio.sql','0002_studio_auth.sql','0003_accounts.sql','0004_astro_builds.sql','0005_build_fingerprint.sql'])db.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const env={SESSION_SECRET:'session-secret',BUILD_CALLBACK_SECRET:'callback-secret',GITHUB_TOKEN:'github-private-token',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'cloudflare-private-token',DB:{prepare(sql){const statement=(args=[])=>({async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:r.changes}};}});return {...statement(),bind(...args){return statement(args);}};}}};
 const user={id:'b'.repeat(32),username:'tfreestone',display_name:'Tanja',role:'editor',salt:'x',password_hash:'x',credential_version:'one'};db.prepare('INSERT INTO studio_users(id,username,display_name,role,salt,password_hash,credential_version) VALUES(?,?,?,?,?,?,?)').run(...Object.values(user));
 const id='1234567890abcdef',project=starterProject(),document=JSON.stringify(project);db.prepare('INSERT INTO projects(id,name,document) VALUES(?,?,?)').run(id,project.name,document);db.prepare('INSERT INTO revisions(project_id,revision,document) VALUES(?,1,?)').run(id,document);
 const cookie=(await cookieFor(user,env)).split(';')[0],original=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('api.cloudflare.com'))return Response.json({success:true,result:{subdomain:'bcraighead70'}});return new Response(null,{status:204});};
 const req=(path,data,authorization)=>worker.fetch(new Request('https://studio.example/api/'+path,{method:data?'POST':'GET',headers:{Origin:'https://studio.example',Cookie:cookie,'Content-Type':'application/json',...(authorization?{Authorization:authorization}:{})},body:data?JSON.stringify(data):undefined}),env);
 try{
  const response=await req('projects/'+id+'/publish',{revision:1,confirm:project.name});assert.equal(response.status,202);const queued=await response.json();assert.equal(queued.status,'queued');assert.equal(calls.filter(c=>c.url.includes('github.com')).length,1);
  const existing=await req('projects/'+id+'/publish',{revision:1,confirm:project.name});assert.equal(existing.status,409);
  const history=await(await req('projects/'+id+'/deployments')).text();for(const secret of ['cloudflare-private-token','github-private-token','build_config'])assert.ok(!history.includes(secret));
  assert.equal((await req('builds/'+queued.deploymentId+'/snapshot')).status,401);
  // Editing the current project after queuing cannot change what the runner builds.
  db.prepare('UPDATE projects SET document=? WHERE id=?').run(JSON.stringify({...project,name:'Later draft'}),id);
  const auth='Bearer '+env.BUILD_CALLBACK_SECRET;const snapshot=await(await req('builds/'+queued.deploymentId+'/snapshot',null,auth)).json();assert.equal(snapshot.project.name,'Barnabas Road Ministries');assert.equal(snapshot.config.token,env.CLOUDFLARE_API_TOKEN);assert.equal(snapshot.config.githubToken,undefined);
  assert.equal((await req('builds/'+queued.deploymentId+'/status',{status:'building'},auth)).status,200);
  assert.equal((await req('builds/'+queued.deploymentId+'/status',{status:'published',url:'https://wrong.example'},auth)).status,400);
  assert.equal((await req('builds/'+queued.deploymentId+'/status',{status:'published',url:queued.url},auth)).status,200);
  const final=db.prepare('SELECT * FROM deployments WHERE id=?').get(queued.deploymentId);assert.equal(final.status,'published');assert.equal(final.build_config,null);db.prepare('UPDATE projects SET document=? WHERE id=?').run(document,id);const repeated=await req('projects/'+id+'/publish',{revision:1,confirm:project.name});assert.equal(repeated.status,200);assert.equal((await repeated.json()).unchanged,true);assert.equal(calls.filter(c=>c.url.includes('github.com')).length,1);
  assert.equal((await req('builds/'+queued.deploymentId+'/snapshot',null,auth)).status,409);
  const encrypted=await sealConfig(env,{token:'private'});assert.ok(!encrypted.includes('private'));assert.equal((await openConfig(env,encrypted)).token,'private');
 }finally{globalThis.fetch=original;db.close();}
});
