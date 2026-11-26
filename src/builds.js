import {equal} from './auth.js';
import {openConfig} from './settings.js';
export async function dispatchBuild(config,deploymentId,projectId){
 if(!config.githubToken)throw Error('The GitHub build connection is not configured.');
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.githubRepository))throw Error('Invalid build repository.');
 const response=await fetch(`https://api.github.com/repos/${config.githubRepository}/actions/workflows/publish-astro.yml/dispatches`,{method:'POST',headers:{Authorization:`Bearer ${config.githubToken}`,Accept:'application/vnd.github+json','User-Agent':'Barnabas-Road-Studio','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'main',inputs:{deployment_id:deploymentId,project_id:projectId}}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('GitHub could not queue the website build ('+response.status+'). Check the super-admin build settings.');
}
export async function buildEndpoint(request,env,path){
 const match=path.match(/^\/api\/builds\/([a-f0-9-]{36})\/(snapshot|status)$/);if(!match)return null;
 const json=(b,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
 if(!env.BUILD_CALLBACK_SECRET||!await equal(request.headers.get('Authorization')||'','Bearer '+env.BUILD_CALLBACK_SECRET))return json({error:'Build authentication required.'},401);
 const row=await env.DB.prepare('SELECT * FROM deployments WHERE id=?').bind(match[1]).first();if(!row)return json({error:'Build not found.'},404);
 if(match[2]==='snapshot'&&request.method==='GET'){
  if(!['queued','building'].includes(row.status))return json({error:'Build is no longer active.'},409);
  const revision=await env.DB.prepare('SELECT document FROM revisions WHERE project_id=? AND revision=?').bind(row.project_id,row.revision).first();if(!revision)return json({error:'Saved revision not found.'},404);
  const config=await openConfig(env,row.build_config);return json({project:JSON.parse(revision.document),config,deploymentId:row.id,revision:row.revision});
 }
 if(match[2]==='status'&&request.method==='POST'){
  if(!['queued','building'].includes(row.status))return json({error:'Build already completed.'},409);
  if(Number(request.headers.get('Content-Length')||0)>5000)return json({error:'Status payload too large.'},400);
  const input=await request.json();if(!['building','published','failed'].includes(input.status))return json({error:'Invalid build status.'},400);
  const config=await openConfig(env,row.build_config);
  if(input.status==='published'&&input.url!==config.url)return json({error:'Unexpected publication address.'},400);
  const runUrl=typeof input.runUrl==='string'&&input.runUrl.startsWith('https://github.com/brianRcraighead/barnabasroadministries/actions/runs/')?input.runUrl:null;
  const error=input.status==='failed'?'The website build failed. Your last published site is still available.':null;
  const result=await env.DB.prepare("UPDATE deployments SET status=?,url=CASE WHEN ?='published' THEN ? ELSE url END,run_url=COALESCE(?,run_url),error=?,build_config=CASE WHEN ? IN ('published','failed') THEN NULL ELSE build_config END WHERE id=? AND status IN ('queued','building') RETURNING id").bind(input.status,input.status,config.url,runUrl,error,input.status,row.id).first();
  return result?json({ok:true}):json({error:'Build already completed.'},409);
 }
 return json({error:'Method not allowed.'},405);
}
