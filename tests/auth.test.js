import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{sessionValid} from '../src/worker.js';
test('API is locked without valid session, even if browser sends forged cookie',async()=>{const env={SESSION_SECRET:'test-session-secret'};for(const cookie of ['',`np_session=${Date.now()+60000}.nonce.bad`]){const response=await worker.fetch(new Request('https://studio.example/api/projects',{headers:{Cookie:cookie}}),env);assert.equal(response.status,401);}});
test('cross-origin writes are rejected before accessing data or credentials',async()=>{const response=await worker.fetch(new Request('https://studio.example/api/projects',{method:'POST',headers:{Origin:'https://evil.example'}}),{});assert.equal(response.status,403);});
test('missing login secrets fail closed',async()=>{const response=await worker.fetch(new Request('https://studio.example/api/login',{method:'POST',headers:{Origin:'https://studio.example'}}),{});assert.equal(response.status,503);assert.equal(await sessionValid(new Request('https://studio.example'),{}),false);});
