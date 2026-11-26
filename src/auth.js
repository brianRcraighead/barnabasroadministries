import {passwordHash} from './password.js';
const enc=new TextEncoder();
export async function equal(a,b){const hash=async v=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v||'')));const [x,y]=await Promise.all([hash(a),hash(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export const publicUser=u=>({username:u.username,displayName:u.display_name,role:u.role});
export async function sessionUser(request,env){
 if(!env.SESSION_SECRET||!env.DB)return null;
 const raw=request.headers.get('Cookie')?.match(/(?:^|;\s*)np_session=([^;]+)/)?.[1]||'';
 const parts=raw.split('.');if(parts.length!==5)return null;
 const [expiry,id,version,nonce,sig]=parts;if(!/^\d+$/.test(expiry)||Number(expiry)<=Date.now()||Number(expiry)>Date.now()+43201000||!/^[a-f0-9]{32}$/.test(id)||!version||!nonce)return null;
 if(!await equal(sig,await sign(parts.slice(0,4).join('.'),env.SESSION_SECRET)))return null;
 const user=await env.DB.prepare('SELECT * FROM studio_users WHERE id=? AND enabled=1').bind(id).first();return user&&await equal(version,user.credential_version)?user:null;
}
export async function cookieFor(user,env){const value=`${Date.now()+43200000}.${user.id}.${user.credential_version}.${crypto.randomUUID()}`;return `np_session=${value}.${await sign(value,env.SESSION_SECRET)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;}
export async function matches(password,user){return typeof password==='string'&&password.length<=128&&await equal(await passwordHash(password,user?.salt||'invalid-user-padding-salt'),user?.password_hash||'');}
export async function limit(request,env,scope){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(scope+':'+(request.headers.get('CF-Connecting-IP')||'local'))));const ip=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');const window=Math.floor(Date.now()/900000);const r=await env.DB.prepare('INSERT INTO login_limits(ip_hash,window,attempts) VALUES(?,?,1) ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN window=excluded.window THEN attempts+1 ELSE 1 END,window=excluded.window RETURNING attempts').bind(ip,window).first();return r.attempts<=10;}
export async function changeUserPassword(env,user,password){const salt=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),hash=await passwordHash(password,salt),version=crypto.randomUUID();return !!await env.DB.prepare('UPDATE studio_users SET salt=?,password_hash=?,credential_version=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND credential_version=? RETURNING id').bind(salt,hash,version,user.id,user.credential_version).first();}
