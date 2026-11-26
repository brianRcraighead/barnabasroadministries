import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker from '../src/worker.js';
import {cookieFor} from '../src/auth.js';
test('custom-site checkpoint survives later saves/publication and cannot be overwritten',async()=>{
 const sqlite=new DatabaseSync(':memory:');try{
  for(const name of ['0001_studio.sql','0002_studio_auth.sql','0003_accounts.sql','0007_project_checkpoints.sql'])sqlite.exec(fs.readFileSync('migrations/'+name,'utf8'));
  const user={id:'a'.repeat(32),username:'tfreestone',credential_version:'test-version'};
  sqlite.prepare('INSERT INTO studio_users(id,username,display_name,role,salt,password_hash,credential_version) VALUES(?,?,?,?,?,?,?)').run(user.id,user.username,'Tanja','editor','salt','hash',user.credential_version);
  const custom={name:'Custom site',theme:'hope-yellow',pages:[{id:'home',path:'/',title:'Home',blocks:[{type:'text',text:'Custom content'}]}]},id='1234567890abcdef',document=JSON.stringify(custom);
  sqlite.prepare('INSERT INTO projects(id,name,document,revision) VALUES(?,?,?,8)').run(id,custom.name,document);sqlite.prepare('INSERT INTO revisions(project_id,revision,document) VALUES(?,8,?)').run(id,document);
  const DB={prepare(sql){const stmt=(args=[])=>({async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return sqlite.prepare(sql).run(...args);}});return {...stmt(),bind(...args){return stmt(args);}};}};
  const env={DB,SESSION_SECRET:'test-only-session-secret'},cookie=(await cookieFor(user,env)).split(';')[0];
  const call=(path,data,token=cookie,origin='https://studio.example')=>worker.fetch(new Request('https://studio.example/api/projects/'+id+path,{method:data?'POST':'GET',headers:{Cookie:token,Origin:origin,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined}),env);
  assert.equal((await call('/checkpoints',null,'')).status,401);assert.equal((await call('/checkpoints',{revision:8},cookie,'https://evil.example')).status,403);assert.equal((await call('/checkpoints',{revision:7})).status,409);
  let response=await call('/checkpoints',{revision:8});assert.equal(response.status,200);assert.equal((await response.json()).checkpoint.revision,8);
  // Move beyond the recent-30 window and record a published replacement.
  for(let rev=9;rev<=40;rev++)sqlite.prepare('INSERT INTO revisions(project_id,revision,document) VALUES(?,?,?)').run(id,rev,JSON.stringify({...custom,theme:'original-site'}));
  sqlite.prepare('UPDATE projects SET revision=40,document=? WHERE id=?').run(JSON.stringify({...custom,theme:'original-site'}),id);
  sqlite.prepare("INSERT INTO deployments(id,project_id,revision,worker_name,status) VALUES('published-old',?,40,'test-site','published')").run(id);
  response=await call('/checkpoints',{revision:40});assert.equal((await response.json()).checkpoint.revision,8);
  const checkpoints=(await(await call('/checkpoints')).json()).checkpoints;assert.equal(checkpoints.length,1);assert.equal(checkpoints[0].revision,8);
  assert.deepEqual((await(await call('/revisions/8')).json()).project,custom);
 }finally{sqlite.close();}
});
