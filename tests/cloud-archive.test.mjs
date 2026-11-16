import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject} from '../src/engine.js';
import {packBackup,validateBackup,backupHash,uploadBackup} from '../src/cloud-archive.js';
const fixture=()=>{const project=newProject();project.layers.push({id:'photo',name:'Referencia',type:'image',visible:true,locked:true,opacity:.5,image:{src:'data:image/png;base64,AA==',x:0,y:0,width:10,height:10,rotation:0}});return {document:{meta:{tags:['toile'],folder:'Vestidos'},project},versions:[{label:'Antes de editar',automatic:false,createdAt:'2026-10-09T10:00:00Z',project:structuredClone(project)}]};};
test('cloud backup preserves geometry, photos, organization and complete history without mutating the local project',async()=>{
 const {document,versions}=fixture(),before=JSON.stringify({document,versions}),payload=packBackup(document,versions),round=validateBackup(JSON.parse(JSON.stringify(payload)));
 assert.deepEqual(round,payload);assert.equal(JSON.stringify({document,versions}),before);assert.equal(round.document.project.layers.at(-1).image.src,document.project.layers.at(-1).image.src);assert.deepEqual(round.document.project.pieces,document.project.pieces);assert.equal(round.versions.length,1);assert.equal(round.document.folder,'Vestidos');
 const hash=await backupHash(payload);assert.match(hash,/^[0-9a-f]{64}$/);assert.equal(await backupHash(round),hash);round.document.project.name='Changed';assert.notEqual(await backupHash(round),hash);
});
test('invalid cloud payloads and histories are rejected before local restoration',()=>{
 const {document,versions}=fixture(),payload=packBackup(document,versions);
 for(const invalid of [null,{}, {...payload,schemaVersion:2},{...payload,versions:Array(121).fill(versions[0])},{...payload,document:{...payload.document,tags:[5]}},{...payload,versions:[{...versions[0],createdAt:'not a date'}]},{...payload,document:{...payload.document,project:{}}}])assert.throws(()=>validateBackup(invalid));
});
test('oversized photos and histories cannot silently exceed the cloud copy limit',()=>{
 const {document,versions}=fixture();document.project.layers.at(-1).image.src='data:image/png;base64,'+'A'.repeat(1024*1024);
 const history=Array.from({length:13},()=>({...versions[0],project:document.project}));
 assert.throws(()=>packBackup(document,history),/12 MB/);assert.equal(document.project.layers.at(-1).image.src.length,1024*1024+22);
});
test('cloud upload uses owner-bound immutable inserts; lost-response retries are idempotent and other errors remain visible',async()=>{
 const {document,versions}=fixture(),payload=packBackup(document,versions),calls=[];
 const client=error=>({from:table=>({insert:async row=>{calls.push({table,row});return {error};}})});
 const hash=await uploadBackup(client(null),'owner-a','project-a',payload);assert.equal(calls[0].table,'patrona_snapshots');assert.equal(calls[0].row.user_id,'owner-a');assert.equal(calls[0].row.project_id,'project-a');assert.equal(calls[0].row.content_hash,hash);
 assert.equal(await uploadBackup(client({code:'23505'}),'owner-a','project-a',payload),hash);
 await assert.rejects(uploadBackup(client({code:'42501',message:'Access denied'}),'owner-b','project-a',payload),/Access denied/);
 await assert.rejects(uploadBackup(client({message:'Network unavailable'}),'owner-a','project-a',payload),/Network unavailable/);
});
