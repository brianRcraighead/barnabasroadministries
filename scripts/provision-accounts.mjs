import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {passwordHash} from '../src/password.js';
if(!process.argv.includes('--local'))throw Error('This helper is local only. Remote provisioning requires the account setup procedure.');
if(!fs.existsSync('.env.accounts'))fs.writeFileSync('.env.accounts','OWNER_USERNAME=bcraighead\nOWNER_PASSWORD='+crypto.randomBytes(20).toString('base64url')+'\n',{mode:0o600});
const vars=Object.fromEntries(fs.readFileSync('.env.accounts','utf8').trim().split(/\r?\n/).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}));
const salt=crypto.randomBytes(32).toString('hex'),values=[crypto.randomBytes(16).toString('hex'),vars.OWNER_USERNAME,'Brian Craighead','super_admin',salt,await passwordHash(vars.OWNER_PASSWORD,salt),crypto.randomUUID()],quote=x=>"'"+x.replaceAll("'","''")+"'";
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/provision-accounts.sql','INSERT INTO studio_users(id,username,display_name,role,salt,password_hash,credential_version) VALUES('+values.map(quote).join(',')+') ON CONFLICT(username) DO NOTHING;');
const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.jsonc','--file','artifacts/provision-accounts.sql'],{stdio:'inherit'});process.exitCode=r.status;
