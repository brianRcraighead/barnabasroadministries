import {serveMedia,mediaEndpoint} from './media.js';
import {starterProject,validateProject,exportFiles} from '../public/lib/site.js';
import {publishProject,cfRequest} from './publish.js';
import {sessionUser,cookieFor,matches,limit,changeUserPassword,publicUser} from './auth.js';
import {deploymentSettings,saveDeploymentSettings,sealConfig} from './settings.js';
import {dispatchBuild,buildEndpoint} from './builds.js';
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export async function sessionValid(request,env){return !!await sessionUser(request,env);}
async function body(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('Send JSON content.');
 const reader=request.body?.getReader();if(!reader)throw new Error('Missing request body.');
 const chunks=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>800000){await reader.cancel();throw new Error('Project exceeds the 800 KB limit.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
const idPattern=/^[a-f0-9]{16}$/;
async function api(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/api/builds/'))return await buildEndpoint(request,env,path)||json({error:'Not found.'},404);
 if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Request origin rejected.'},403);
 if(path==='/api/login'&&request.method==='POST'){
  if(!env.SESSION_SECRET)return json({error:'Studio sign-in is not configured.'},503);
  const payload=await body(request),username=String(payload.username||'').trim().toLowerCase();
  if(!await limit(request,env,'login'))return json({error:'Too many sign-in attempts. Try again in 15 minutes.'},429);
  const user=await env.DB.prepare('SELECT * FROM studio_users WHERE username=? AND enabled=1').bind(username).first();
  if(!await matches(payload.password,user))return json({error:'Incorrect username or password.'},401);
  return json({ok:true,user:publicUser(user)},200,{'Set-Cookie':await cookieFor(user,env)});
 }
 const user=await sessionUser(request,env);
 if(!user)return json({error:'Sign in to the studio.'},401);
 if(path.startsWith('/api/media'))return await mediaEndpoint(request,env)||json({error:'Not found.'},404);
 if(path==='/api/password'&&request.method==='POST'){
  const payload=await body(request);
  if(typeof payload.newPassword!=='string'||payload.newPassword.length<12||payload.newPassword.length>128)return json({error:'Use a new password between 12 and 128 characters.'},400);
  if(payload.newPassword!==payload.confirmPassword)return json({error:'The new passwords do not match.'},400);
  if(payload.newPassword===payload.currentPassword)return json({error:'Choose a different password.'},400);
  if(!await limit(request,env,'password:'+user.id))return json({error:'Too many password attempts. Try again in 15 minutes.'},429);
  if(!await matches(payload.currentPassword,user))return json({error:'The current password is incorrect.'},403);
  if(!await changeUserPassword(env,user,payload.newPassword))return json({error:'The password changed in another session. Sign in again.'},409);
  return json({ok:true},200,{'Set-Cookie':'np_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});
 }
 if(path==='/api/session')return json({authenticated:true,user:publicUser(user),publishing:true});
 if(path==='/api/admin/settings'){
  if(user.role!=='super_admin')return json({error:'Super-admin access is required.'},403);
  const current=await deploymentSettings(env);
  if(request.method==='GET')return json({accountId:current.accountId,prefix:current.prefix,workerName:current.workerName||env.PUBLIC_WORKER_NAME||'',tokenConfigured:!!current.token,githubRepository:current.githubRepository,githubConfigured:!!current.githubToken});
  if(request.method==='POST'){
   const input=await body(request),value={accountId:input.accountId,prefix:input.prefix,workerName:input.workerName||current.workerName||env.PUBLIC_WORKER_NAME||'',token:input.token||current.token,githubRepository:current.githubRepository||'brianRcraighead/barnabasroadministries',githubToken:input.githubToken||current.githubToken};
   if(!/^[a-f0-9]{32}$/.test(value.accountId||'')||!/^[a-z][a-z0-9-]{0,30}$/.test(value.prefix||'')||typeof value.token!=='string'||value.token.length>512||typeof value.githubToken!=='string'||value.githubToken.length>512)return json({error:'Enter a valid account ID, Worker prefix, and API token.'},400);
   if(!/^[a-z][a-z0-9-]{0,62}$/.test(value.workerName))return json({error:'Enter a valid website Worker name.'},400);if(value.token)await cfRequest({CLOUDFLARE_ACCOUNT_ID:value.accountId,CLOUDFLARE_API_TOKEN:value.token},'/workers/subdomain');
   await saveDeploymentSettings(env,value);return json({ok:true});
  }
  return json({error:'Method not allowed.'},405);
 }
 if(path==='/api/logout'&&request.method==='POST')return json({ok:true},200,{'Set-Cookie':'np_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});
 if(path==='/api/projects'&&request.method==='GET')return json({projects:(await env.DB.prepare('SELECT id,name,revision,updated_at FROM projects ORDER BY updated_at DESC LIMIT 100').all()).results});
 if(path==='/api/projects'&&request.method==='POST'){
  const p=validateProject((await body(request)).project||starterProject());
  const id=crypto.randomUUID().replaceAll('-','').slice(0,16),document=JSON.stringify(p);
  await env.DB.batch([env.DB.prepare('INSERT INTO projects(id,name,document) VALUES(?,?,?)').bind(id,p.name,document),env.DB.prepare('INSERT INTO revisions(project_id,revision,document) VALUES(?,1,?)').bind(id,document)]);
  return json({id,project:p,revision:1},201);
 }
 const revisionMatch=path.match(/^\/api\/projects\/([a-f0-9]{16})\/revisions\/(\d+)$/);
 if(revisionMatch&&request.method==='GET'){const revision=await env.DB.prepare('SELECT document FROM revisions WHERE project_id=? AND revision=?').bind(revisionMatch[1],Number(revisionMatch[2])).first();return revision?json({project:JSON.parse(revision.document)}):json({error:'Revision not found.'},404);}
 const match=path.match(/^\/api\/projects\/([^/]+)(?:\/(revisions|export|publish|deployments|checkpoints))?$/);
 if(!match||!idPattern.test(match[1]))return json({error:'Not found.'},404);
 const [,id,action]=match;
 const row=await env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(id).first();
 if(!row)return json({error:'Project not found.'},404);
 if(action==='checkpoints'&&request.method==='GET')return json({checkpoints:(await env.DB.prepare('SELECT revision,label,created_at FROM project_checkpoints WHERE project_id=?').bind(id).all()).results});
 if(action==='checkpoints'&&request.method==='POST'){
  const input=await body(request);
  if(input.revision!==row.revision)return json({error:'Another editor saved this project. Reload before restoring the original site.'},409);
  const existing=await env.DB.prepare('SELECT revision,label,created_at FROM project_checkpoints WHERE project_id=?').bind(id).first();
  if(existing)return json({checkpoint:existing});
  if(JSON.parse(row.document).originalRestoration?.version)return json({error:'Load the custom site from a saved revision before creating its checkpoint.'},409);
  await env.DB.prepare("INSERT INTO project_checkpoints(project_id,revision,label) SELECT id,revision,'Custom site before original restoration' FROM projects WHERE id=? AND revision=? ON CONFLICT(project_id) DO NOTHING").bind(id,input.revision).run();
  const checkpoint=await env.DB.prepare('SELECT revision,label,created_at FROM project_checkpoints WHERE project_id=?').bind(id).first();
  return checkpoint?json({checkpoint}):json({error:'The saved project changed. Try again after reloading.'},409);
 }
 if(!action&&request.method==='GET')return json({id,project:JSON.parse(row.document),revision:row.revision});
 if(!action&&request.method==='PUT'){
  const input=await body(request),p=validateProject(input.project),document=JSON.stringify(p);
  if(!Number.isInteger(input.revision))return json({error:'Missing revision.'},400);
  if(input.revision!==row.revision)return json({error:'Another editor saved this project. Export your draft before reloading.'},409);
  if(document===row.document)return json({revision:row.revision,unchanged:true});
  const next=input.revision+1;
  const results=await env.DB.batch([
   env.DB.prepare('INSERT INTO revisions(project_id,revision,document) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM projects WHERE id=? AND revision=?)').bind(id,next,document,id,input.revision),
   env.DB.prepare('UPDATE projects SET name=?,document=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(p.name,document,id,input.revision)
  ]);
  if(!results[1].meta.changes)return json({error:'Another editor saved this project. Export your draft before reloading.'},409);
  return json({revision:next});
 }
 if(action==='export'&&request.method==='GET')return json({files:exportFiles(JSON.parse(row.document))});
 if(action==='revisions'&&request.method==='GET')return json({revisions:(await env.DB.prepare('SELECT revision,created_at FROM revisions WHERE project_id=? ORDER BY revision DESC LIMIT 30').bind(id).all()).results});
 if(action==='deployments'&&request.method==='GET')return json({deployments:(await env.DB.prepare('SELECT id,project_id,revision,worker_name,url,status,created_at,run_url,error FROM deployments WHERE project_id=? ORDER BY created_at DESC LIMIT 20').bind(id).all()).results});
 if(action==='publish'&&request.method==='POST'){
  const input=await body(request);if(input.revision!==row.revision||input.confirm!==row.name)return json({error:'Save first and confirm the organization name to publish.'},409);
  const config=await deploymentSettings(env);
  if(!config.token)return json({error:'Add a long-term Cloudflare publishing token in Deployment & API. The temporary setup token is intentionally not stored.'},503);
  if(!env.BUILD_CALLBACK_SECRET||!config.githubToken)return json({error:'The hosted build connection needs super-admin setup.'},503);
  const account=await cfRequest({CLOUDFLARE_ACCOUNT_ID:config.accountId,CLOUDFLARE_API_TOKEN:config.token},'/workers/subdomain');
  const workerName=config.workerName||`${config.prefix}-${id}`,siteUrl=`https://${workerName}.${account.subdomain}.workers.dev`,deployment=crypto.randomUUID();
  const keyBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(row.document+'|'+workerName+'|'+siteUrl+'|'+(env.CF_VERSION_METADATA?.id||'local')));
  const fingerprint=Array.from(new Uint8Array(keyBytes),b=>b.toString(16).padStart(2,'0')).join('');
  const previous=await env.DB.prepare("SELECT id,url FROM deployments WHERE project_id=? AND fingerprint=? AND status='published' ORDER BY created_at DESC LIMIT 1").bind(id,fingerprint).first();
  if(previous)return json({deploymentId:previous.id,status:'published',url:previous.url,unchanged:true});
  const privateConfig=await sealConfig(env,{accountId:config.accountId,token:config.token,workerName,url:siteUrl});
  const lock=await env.DB.prepare("INSERT INTO deployments(id,project_id,revision,worker_name,status,build_config,fingerprint) SELECT ?,?,?,?,'queued',?,? WHERE NOT EXISTS(SELECT 1 FROM deployments WHERE project_id=? AND status IN ('queued','building') AND created_at>datetime('now','-30 minutes')) RETURNING id").bind(deployment,id,row.revision,workerName,privateConfig,fingerprint,id).first();
  if(!lock)return json({error:'A website build is already running. Check publishing history before trying again.'},409);
  try{await dispatchBuild(config,deployment,id);return json({deploymentId:deployment,status:'queued',url:siteUrl},202);}
  catch(error){await env.DB.prepare("UPDATE deployments SET status='failed',build_config=NULL,error=? WHERE id=?").bind(error.message,deployment).run();return json({error:error.message},502);}
 }
 return json({error:'Method not allowed.'},405);
}
export default {async fetch(request,env){
 try{const media=await serveMedia(request,env);if(media)return media;if(new URL(request.url).pathname.startsWith('/api/'))return await api(request,env);return await env.ASSETS.fetch(request);}
 catch(e){console.error('Studio request failed',e.name);return json({error:e instanceof SyntaxError?'Invalid JSON.':e.message||'Request failed.'},400);}
}};
