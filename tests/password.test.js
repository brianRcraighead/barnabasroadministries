import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {passwordHash} from '../src/password.js';
async function environment(){
 const sqlite=new DatabaseSync(':memory:');
 for(const file of ['0001_studio.sql','0002_studio_auth.sql','0003_accounts.sql'])sqlite.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const salt='test-salt',hash=await passwordHash('initial-test-password',salt);
 for(const [id,name,role] of [['a'.repeat(32),'tfreestone','editor'],['b'.repeat(32),'tcfreestone','super_admin']])sqlite.prepare('INSERT INTO studio_users(id,username,display_name,role,salt,password_hash,credential_version) VALUES(?,?,?,?,?,?,?)').run(id,name,name,role,salt,hash,'initial');
 const DB={prepare(sql){
  const statement=(args=[])=>({async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){sqlite.prepare(sql).run(...args);return {success:true};}});
  return {...statement(),bind(...args){return statement(args);}};
 }};
 return {sqlite,STUDIO_PASSWORD:'initial-test-password',SESSION_SECRET:'test-signing-secret',CLOUDFLARE_ACCOUNT_ID:'c'.repeat(32),CLOUDFLARE_API_TOKEN:'test-token',DB};
}
function call(env,path,data,cookie,origin='https://studio.example'){return worker.fetch(new Request('https://studio.example/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}),env);}
async function login(env,password,username='tfreestone'){const r=await call(env,'login',{password,username});return {r,cookie:r.headers.get('Set-Cookie')?.split(';')[0]};}
test('password rotation persists a hash, rejects old passwords and revokes every previous session',async()=>{
 const env=await environment();try{
  const a=await login(env,env.STUDIO_PASSWORD),b=await login(env,env.STUDIO_PASSWORD),admin=await login(env,env.STUDIO_PASSWORD,'tcfreestone');assert.equal(a.r.status,200);assert.equal((await call(env,'session',null,a.cookie)).status,200);
  assert.equal((await call(env,'password',{currentPassword:'wrong',newPassword:'new-test-password-123',confirmPassword:'new-test-password-123'},a.cookie)).status,403);
  assert.equal((await call(env,'password',{currentPassword:env.STUDIO_PASSWORD,newPassword:'short',confirmPassword:'short'},a.cookie)).status,400);
  assert.equal((await call(env,'password',{currentPassword:env.STUDIO_PASSWORD,newPassword:'new-test-password-123',confirmPassword:'different'},a.cookie)).status,400);
  assert.equal((await call(env,'password',{currentPassword:env.STUDIO_PASSWORD,newPassword:'new-test-password-123',confirmPassword:'new-test-password-123'},a.cookie,'https://evil.example')).status,403);
  const change=await call(env,'password',{currentPassword:env.STUDIO_PASSWORD,newPassword:'new-test-password-123',confirmPassword:'new-test-password-123'},a.cookie);assert.equal(change.status,200);assert.match(change.headers.get('Set-Cookie'),/Max-Age=0/);
  for(const cookie of [a.cookie,b.cookie])assert.equal((await call(env,'session',null,cookie)).status,401);
  assert.equal((await login(env,env.STUDIO_PASSWORD)).r.status,401);
  const fresh=await login(env,'new-test-password-123');assert.equal(fresh.r.status,200);assert.equal((await call(env,'session',null,fresh.cookie)).status,200);
  assert.equal((await call(env,'session',null,admin.cookie)).status,200);const stored=env.sqlite.prepare("SELECT * FROM studio_users WHERE username='tfreestone'").get();assert.equal(stored.password_hash.length,64);assert.equal(stored.salt.length,64);assert.ok(!JSON.stringify(stored).includes('new-test-password'));
  env.STUDIO_PASSWORD='changed-bootstrap-on-redeploy';assert.equal((await login(env,'new-test-password-123')).r.status,200);assert.equal((await login(env,env.STUDIO_PASSWORD)).r.status,401);
 }finally{env.sqlite.close();}
});
test('password changes require a valid session and rate-limit incorrect current passwords',async()=>{
 const env=await environment();try{const payload={currentPassword:'wrong',newPassword:'new-test-password-123',confirmPassword:'new-test-password-123'};assert.equal((await call(env,'password',payload)).status,401);const {cookie}=await login(env,env.STUDIO_PASSWORD);for(let i=0;i<10;i++)assert.equal((await call(env,'password',payload,cookie)).status,403);assert.equal((await call(env,'password',payload,cookie)).status,429);assert.equal(env.sqlite.prepare("SELECT count(*) AS n FROM studio_users WHERE credential_version<>'initial'").get().n,0);}finally{env.sqlite.close();}
});

test('editor cannot read or change deployment secrets, while super admin sees only safe metadata',async()=>{const env=await environment();try{const editor=await login(env,env.STUDIO_PASSWORD),admin=await login(env,env.STUDIO_PASSWORD,'tcfreestone');assert.equal((await call(env,'admin/settings',null,editor.cookie)).status,403);assert.equal((await call(env,'admin/settings',{accountId:'d'.repeat(32),prefix:'other',token:'bad'},editor.cookie)).status,403);const response=await call(env,'admin/settings',null,admin.cookie);assert.equal(response.status,200);const value=await response.json();assert.equal(value.tokenConfigured,true);assert.ok(!JSON.stringify(value).includes('test-token'));assert.equal(value.token,undefined);assert.equal((await call(env,'admin/settings')).status,401);}finally{env.sqlite.close();}});
