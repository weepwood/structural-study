/** HTTP smoke tests for the local preview, no dependencies required. */
import assert from 'node:assert/strict';
import { createPreviewServer } from './serve.mjs';

const server = createPreviewServer();
await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',resolve);
});
const base = 'http://127.0.0.1:' + server.address().port;
let count = 0;
try {
  const cases = [
    ['GET','/',200,'text/html'],
    ['GET','/index.html',200,'text/html'],
    ['GET','/skill.html',200,'text/html'],
    ['GET','/design-system',200,'text/html'],
    ['GET','/design-system/',200,'text/html'],
    ['GET','/design-system/tokens.css',200,'text/css'],
    ['GET','/design-system/tokens.json',200,'application/json'],
    ['GET','/skills/orthographic-blueprint.zip',200,'application/zip'],
    ['GET','/skills/orthographic-blueprint/assets/drawing-template.html',200,'text/html'],
    ['GET','/design-system/missing.css',404],
    ['GET','/.gitignore',403],
    ['GET','/.github/workflows/deploy-pages.yml',403],
    ['GET','/scripts/verify.mjs',403],
    ['GET','/..%2F.gitignore',403],
    ['POST','/',405],
    ['HEAD','/index.html',200,'text/html'],
  ];
  for(const [method,path,status,contentType] of cases){
    const response = await fetch(base+path,{method});
    assert.equal(response.status,status,method+' '+path);
    if(contentType) assert.ok(
      response.headers.get('content-type')?.startsWith(contentType),
      method+' '+path+' content-type'
    );
    const body = await response.text();
    if(method === 'HEAD') assert.equal(body,'','HEAD must not send body');
    if(method === 'GET' && status === 200) assert.ok(body.length>0,path+' must not be empty');
    console.log('PASS '+method+' '+path+' -> '+response.status);
    count++;
  }
  console.log('\n'+count+'/'+count+' HTTP checks passed');
} finally {
  await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
}
