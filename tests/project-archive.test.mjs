import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import {IDBFactory} from 'fake-indexeddb';
import * as cloud from '../src/cloud-archive.js';
import * as engine from '../src/engine.js';import * as vector from '../src/vector.js';
const compile=file=>ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function storeModule(factory=new IDBFactory(),clock=Date){const module={exports:{}};vm.runInNewContext(compile('../src/project-store.ts'),{module,exports:module.exports,require:n=>({'./engine':engine,'./vector':vector,'./cloud-archive':cloud})[n],indexedDB:factory,Date:clock});return {...module.exports,factory};}
const plain=x=>JSON.parse(JSON.stringify(x));
test('cloud recovery creates an independent project and remaps every history entry without changing the active local original',async()=>{
 const m=storeModule(),s=m.projectStore,original=await s.bootstrap(engine.newProject());await s.checkpoint(original.meta.id,original.meta.revision,'Local checkpoint');
 const snapshot=await s.snapshot(original.meta.id),payload=cloud.packBackup(snapshot.document,snapshot.versions),restored=await s.restoreBackup(payload);
 assert.notEqual(restored.meta.id,original.meta.id);assert.match(restored.project.name,/recuperado/);assert.deepEqual(plain(restored.project.pieces),plain(original.project.pieces));
 const versions=await s.versions(restored.meta.id);assert.equal(versions.length,snapshot.versions.length);assert.ok(versions.every(v=>v.projectId===restored.meta.id));assert.ok(versions.every(v=>!snapshot.versions.some(old=>old.id===v.id)));
 const reopened=await s.bootstrap(engine.newProject());assert.equal(reopened.meta.id,original.meta.id);assert.equal((await s.list()).length,2);
 await assert.rejects(s.restoreBackup({...payload,versions:[{}]}));assert.equal((await s.list()).length,2);
});
async function rawDB(factory){return new Promise((resolve,reject)=>{const r=factory.open('patrona-cad.projects',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function hookHarness(mod,p=engine.newProject()){
 const slots=[];let cursor=0,effects=[];const listeners=new Map();const h={project:p,notices:[]};
 const react={useState(initial){const i=cursor++;slots[i]??={value:typeof initial==='function'?initial():initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;}];},useRef(value){const i=cursor++;slots[i]??={current:value};return slots[i];},useCallback(fn,deps){const i=cursor++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j]))slots[i]={value:fn,deps};return slots[i].value;},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j])){effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}}};
 const module={exports:{}};const target={addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)};
 vm.runInNewContext(compile('../src/useProjectArchive.ts'),{module,exports:module.exports,require:n=>({'react':react,'./project-store':mod})[n],setTimeout,clearTimeout,document:{...target,visibilityState:'visible'},window:target});
 h.render=()=>{cursor=0;effects=[];h.archive=module.exports.default(h.project,p=>{h.project=p;},m=>h.notices.push(m));for(const effect of effects)effect();return h.archive;};h.dispose=()=>{for(const slot of slots)slot?.cleanup?.();};h.event=(name,...args)=>listeners.get(name)?.(...args);h.render();return h;
}
async function ready(h){for(let i=0;i<1000;i++){await new Promise(resolve=>setImmediate(resolve));h.render();if(h.archive.ready)return;}throw Error('Workspace did not initialize');}
test('migration is atomic and runs once; reopening does not replace the active project with legacy localStorage',async()=>{
 const m=storeModule();const original=engine.newProject();original.name='Trabajo anterior';original.layers.push({id:'foto',name:'Referencia',type:'image',visible:true,locked:true,opacity:.5,image:{src:'data:image/png;base64,AA==',x:0,y:0,width:10,height:10}});
 const first=await m.projectStore.bootstrap(original),second=await m.projectStore.bootstrap({...engine.newProject(),name:'Datos viejos'});assert.equal(first.meta.id,second.meta.id);assert.equal(second.project.name,'Trabajo anterior');assert.equal(second.project.layers[1].image.src,original.layers[1].image.src);assert.equal((await m.projectStore.list()).length,1);assert.equal((await m.projectStore.versions(first.meta.id)).length,1);
});
test('blank projects preserve all earlier projects and metadata is separate from document images',async()=>{
 const m=storeModule(),a=await m.projectStore.bootstrap(engine.newProject()),b=await m.projectStore.create(m.blankProject());await m.projectStore.activate(b.meta.id);assert.equal(b.project.pieces.length,0);assert.equal((await m.projectStore.read(a.meta.id)).project.pieces.length,2);assert.equal((await m.projectStore.list()).length,2);assert.ok(!(await m.projectStore.list()).some(x=>'project' in x));assert.doesNotThrow(()=>engine.parseProject(JSON.stringify(b.project)));
});
test('concurrent editors cannot overwrite: exactly one revision succeeds and failed transaction leaves all data intact',async()=>{
 const m=storeModule(),a=await m.projectStore.bootstrap(engine.newProject());const outputs=await Promise.allSettled([m.projectStore.save(a.meta.id,1,{...a.project,name:'Tab A'}),m.projectStore.save(a.meta.id,1,{...a.project,name:'Tab B'})]);assert.equal(outputs.filter(r=>r.status==='fulfilled').length,1);const error=outputs.find(r=>r.status==='rejected').reason;assert.equal(error.constructor.name,'ConflictError');const d=await m.projectStore.read(a.meta.id);assert.equal(d.meta.revision,2);assert.equal(d.meta.name,d.project.name);assert.equal(d.project.name,outputs.find(r=>r.status==='fulfilled').value.project.name);
});
test('checkpoint survives reopening and restores geometry while retaining a pre-restore snapshot',async()=>{
 const m=storeModule(),h=hookHarness(m);await ready(h);const id=h.archive.meta.id;h.project={...h.project,name:'Antes de sisa'};h.render();await h.archive.checkpoint('Antes de sisa');h.render();h.project={...h.project,name:'Después',annotations:[{type:'line',a:{x:2,y:3},b:{x:5,y:6},layerId:'base'}]};h.render();await h.archive.flush();h.render();const version=(await m.projectStore.versions(id)).find(v=>v.label==='Antes de sisa');await h.archive.restore(version);h.render();assert.equal(h.project.name,'Antes de sisa');assert.equal(h.project.annotations.length,0);const list=await m.projectStore.versions(id);assert.equal(list.find(v=>v.label.startsWith('Antes de restaurar')).project.annotations.length,1);h.dispose();const reopened=hookHarness(m);await ready(reopened);assert.equal(reopened.project.name,'Antes de sisa');assert.equal(reopened.archive.meta.id,id);reopened.dispose();
});
test('switching immediately flushes pending drawings; new blank opens independently; undo histories are reset via onLoad',async()=>{
 const m=storeModule(),h=hookHarness(m);await ready(h);const id=h.archive.meta.id;h.project={...h.project,name:'Guardado al cambiar',annotations:[{type:'line',a:{x:1,y:1},b:{x:7,y:9}}]};h.render();await h.archive.create(m.blankProject());h.render();assert.equal(h.project.pieces.length,0);assert.notEqual(h.archive.meta.id,id);const previous=await m.projectStore.read(id);assert.equal(previous.project.annotations.length,1);await h.archive.open(id);h.render();assert.equal(h.project.name,'Guardado al cambiar');assert.equal(h.project.annotations.length,1);h.dispose();
});
test('two active hooks preserve both edits by forking stale writer instead of silently replacing geometry',async()=>{
 const m=storeModule(),a=hookHarness(m),b=hookHarness(m);await ready(a);await ready(b);const id=a.archive.meta.id;a.project={...a.project,name:'Edición A'};a.render();await a.archive.flush();a.render();b.project={...b.project,name:'Edición B',guides:[{axis:'x',value:37}]};b.render();await b.archive.flush();b.render();assert.notEqual(b.archive.meta.id,id);assert.equal(b.project.guides[0].value,37);assert.ok(b.project.name.includes('conflicto'));assert.equal((await m.projectStore.read(id)).project.name,'Edición A');assert.equal((await m.projectStore.list()).length,2);assert.ok(b.notices.some(s=>s.includes('ambas versiones')));a.dispose();b.dispose();
});
test('trash is reversible, protects active project and retains versions',async()=>{
 const m=storeModule(),a=await m.projectStore.bootstrap(engine.newProject()),b=await m.projectStore.create(m.blankProject());await assert.rejects(m.projectStore.trash(a.meta.id,true),/Abre otro/);await m.projectStore.activate(b.meta.id);await m.projectStore.trash(a.meta.id,true);assert.ok((await m.projectStore.read(a.meta.id)).meta.deletedAt);await assert.rejects(m.projectStore.activate(a.meta.id),/Restaura primero/);assert.equal((await m.projectStore.versions(a.meta.id)).length,1);await m.projectStore.trash(a.meta.id,false);await m.projectStore.activate(a.meta.id);assert.equal((await m.projectStore.read(a.meta.id)).meta.deletedAt,null);
});
test('periodic recovery captures the previous complete project and prunes automatic versions only',async()=>{
 let time=Date.now();class Clock extends Date{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
 const m=storeModule(new IDBFactory(),Clock);let d=await m.projectStore.bootstrap(engine.newProject());await m.projectStore.checkpoint(d.meta.id,1,'Conservar siempre');for(let i=0;i<25;i++){time+=301000;d=await m.projectStore.save(d.meta.id,d.meta.revision,{...d.project,name:'Edición '+i});}const versions=await m.projectStore.versions(d.meta.id);assert.equal(versions.filter(v=>v.automatic).length,20);assert.ok(versions.some(v=>v.label==='Conservar siempre'));assert.ok(versions.some(v=>v.automatic&&v.project.name==='Edición 23'));assert.equal((await m.projectStore.read(d.meta.id)).project.name,'Edición 24');
});
test('invalid imported data/organization cannot damage existing snapshots',async()=>{
 const m=storeModule(),d=await m.projectStore.bootstrap(engine.newProject());await assert.rejects(m.projectStore.save(d.meta.id,1,{...d.project,name:'x'.repeat(101)}));await assert.rejects(m.projectStore.save(d.meta.id,1,d.project,{tags:['x'.repeat(61)],folder:''}));assert.equal((await m.projectStore.read(d.meta.id)).meta.revision,1);assert.equal((await m.projectStore.versions(d.meta.id)).length,1);
});
test('transaction abort reports failure without changing document or metadata',async()=>{
 const m=storeModule(),d=await m.projectStore.bootstrap(engine.newProject()),db=await rawDB(m.factory);const original=db.transaction.bind(db);db.transaction=(...args)=>{const t=original(...args);if(args[1]==='readwrite')queueMicrotask(()=>t.abort());return t;};
 // Use the same connection as the store by failing the factory request's transaction globally for one operation.
 const prototype=Object.getPrototypeOf(db),method=prototype.transaction;prototype.transaction=function(...args){const t=method.apply(this,args);if(args[1]==='readwrite')queueMicrotask(()=>t.abort());return t;};
 try{await assert.rejects(m.projectStore.save(d.meta.id,1,{...d.project,name:'No se guarda'}),/No se pudo guardar/);}finally{prototype.transaction=method;db.close();}
 assert.equal((await m.projectStore.read(d.meta.id)).project.name,d.project.name);assert.equal((await m.projectStore.read(d.meta.id)).meta.revision,1);
});
test('thumbnail excludes hidden and image layers and keeps real Bézier commands',()=>{
 const m=storeModule(),p=engine.newProject();p.pieces[0].visible=false;const preview=m.previewOf(p);assert.equal(preview.paths.length,1);assert.ok(preview.paths[0].d.includes('C'));assert.equal(m.previewOf(m.blankProject()).paths.length,0);assert.ok(preview.viewBox.split(' ').every(n=>Number.isFinite(Number(n))));
});
