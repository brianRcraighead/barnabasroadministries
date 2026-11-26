import fs from 'node:fs/promises';
import crypto from 'node:crypto';
// Creates only ignored local configuration. Does not provision or deploy anything.
const config=JSON.parse(await fs.readFile(new URL('../wrangler.studio.jsonc',import.meta.url),'utf8'));
config.d1_databases[0].database_id='00000000-0000-0000-0000-000000000001';
await fs.writeFile(new URL('../wrangler.local.jsonc',import.meta.url),JSON.stringify(config,null,2)+'\n');
const vars=new URL('../.dev.vars',import.meta.url);
try{await fs.access(vars);}catch{await fs.writeFile(vars,`STUDIO_PASSWORD=${crypto.randomBytes(24).toString('base64url')}\nSESSION_SECRET=${crypto.randomBytes(48).toString('base64url')}\n`,{mode:0o600});}
console.log('Local configuration prepared. Run scripts/provision-accounts.mjs --local next. Account credentials will be in ignored .env.accounts.');
