import {parseProject,pathData,transform,uid,newProject} from './engine';
import {annotationNodes} from './vector';
import type {Project,Point} from './types';
import {validateBackup} from './cloud-archive';

export function blankProject():Project{return {...newProject(),name:'Proyecto en blanco',pieces:[],annotations:[],guides:[],draftingAids:[],designDrafts:[]};}
export type Preview={viewBox:string;paths:{d:string;color:string;transform?:string;closed:boolean}[]};
export type ProjectMeta={id:string;name:string;tags:string[];folder:string;createdAt:string;updatedAt:string;revision:number;deletedAt:string|null;checkpointAt:string;preview:Preview};
export type Document={meta:ProjectMeta;project:Project};
export type ProjectVersion={id:string;projectId:string;createdAt:string;label:string;automatic:boolean;project:Project};
export class ConflictError extends Error{constructor(){super('Este proyecto cambió en otra pestaña. Se conservará tu trabajo en una copia.');}}
const clean=(p:Project)=>parseProject(JSON.stringify({...p,scaleChecked:false}));
const date=()=>new Date().toISOString();
const storageError=()=>Error('No se pudo guardar en este dispositivo. Puede faltar espacio. Descarga un JSON antes de cerrar.');
export function previewOf(p:Project):Preview{
 const paths:Preview['paths']=[],points:Point[]=[];
 const visible=(id?:string)=>{const l=p.layers.find(l=>l.id===(id||'base'));return !l||l.visible&&l.opacity>0;};
 for(const piece of p.pieces.filter(x=>x.visible&&visible(x.layerId))){paths.push({d:pathData(piece.outline),color:piece.color,transform:`translate(${piece.x} ${piece.y}) rotate(${piece.rotation}) scale(${piece.mirror?-1:1} 1)`,closed:true});for(const n of piece.outline)for(const pt of [n,n.c1,n.c2])if(pt)points.push(transform(piece,pt));}
 for(const a of p.annotations.filter(a=>visible(a.layerId))){const nodes=annotationNodes(a);paths.push({d:pathData(nodes,!!a.closed),color:'#26777d',closed:!!a.closed});for(const n of nodes)for(const pt of [n,n.c1,n.c2])if(pt)points.push(pt);}
 let minX=0,minY=0,maxX=10,maxY=10;for(const pt of points){minX=Math.min(minX,pt.x);minY=Math.min(minY,pt.y);maxX=Math.max(maxX,pt.x);maxY=Math.max(maxY,pt.y);}const w=maxX-minX,h=maxY-minY,pad=Math.max(w,h)*.06;
 return {paths,viewBox:`${minX-pad} ${minY-pad} ${w+2*pad} ${h+2*pad}`};
}
// Each write is one IndexedDB transaction. Revision checks prevent last-writer-wins data loss.
export function createProjectStore(factory:IDBFactory=globalThis.indexedDB,name='patrona-cad.projects'){
 let connection:Promise<IDBDatabase>|undefined;
 function db(){return connection??=new Promise<IDBDatabase>((resolve,reject)=>{
  if(!factory){connection=undefined;reject(storageError());return;}
  const r=factory.open(name,1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('projects',{keyPath:'id'});d.createObjectStore('documents',{keyPath:'id'});d.createObjectStore('settings');const v=d.createObjectStore('versions',{keyPath:'id'});v.createIndex('projectId','projectId');};
  r.onsuccess=()=>{const d=r.result;d.onversionchange=()=>{d.close();connection=undefined;};resolve(d);};r.onerror=()=>{connection=undefined;reject(storageError());};r.onblocked=()=>{connection=undefined;reject(Error('Cierra las otras pestañas de Patrona para abrir el archivo local.'));};
 });}
 async function transaction<T>(stores:string[],mode:IDBTransactionMode,work:(t:IDBTransaction,result:(v:T)=>void,fail:(e:Error)=>void)=>void):Promise<T>{const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(stores,mode);let value:T,error:Error|undefined;const fail=(e:Error)=>{error=e;t.abort();};t.oncomplete=()=>resolve(value);t.onerror=()=>{};t.onabort=()=>reject(error||storageError());try{work(t,v=>{value=v;},fail);}catch(e){fail(e as Error);}});}
 function organization(tags:string[],folder:string){if(!Array.isArray(tags)||tags.length>12||tags.some(t=>typeof t!=='string'||t.length>60)||typeof folder!=='string'||folder.length>60)throw Error('Organización no válida: hasta 12 etiquetas de 60 caracteres y una carpeta de 60.');return {tags:[...new Set(tags.map(t=>t.trim()).filter(Boolean))],folder:folder.trim()};}
 function make(project:Project,tags:string[]=[],folder=''):Document{const p=clean(project),now=date();return {project:p,meta:{id:uid(),name:p.name,...organization(tags,folder),createdAt:now,updatedAt:now,revision:1,deletedAt:null,checkpointAt:now,preview:previewOf(p)}};}
 function write(t:IDBTransaction,d:Document){t.objectStore('projects').put(d.meta);t.objectStore('documents').put({id:d.meta.id,project:d.project});}
 function version(t:IDBTransaction,d:Document,label:string,automatic=false){const v:ProjectVersion={id:uid(),projectId:d.meta.id,createdAt:date(),label:label.trim().slice(0,100)||'Versión guardada',automatic,project:d.project};t.objectStore('versions').put(v);return v;}
 return {
  async bootstrap(initial:Project):Promise<Document>{return transaction(['projects','documents','versions','settings'],'readwrite',(t,done,fail)=>{
   const r=t.objectStore('settings').get('active');r.onsuccess=()=>{const id=r.result as string|undefined;if(!id){const d=make(initial);write(t,d);version(t,d,'Proyecto recuperado');t.objectStore('settings').put(d.meta.id,'active');done(d);return;}
    const m=t.objectStore('projects').get(id);m.onsuccess=()=>{if(!m.result||m.result.deletedAt){fail(Error('No se encuentra el proyecto activo. Tus datos se conservan; reintenta abrir Mis proyectos.'));return;}const p=t.objectStore('documents').get(id);p.onsuccess=()=>{try{done({meta:m.result,project:clean(p.result.project)});}catch(e){fail(e as Error);}};};};
  });},
  async list():Promise<ProjectMeta[]>{return transaction(['projects'],'readonly',(t,done)=>{const r=t.objectStore('projects').getAll();r.onsuccess=()=>done(r.result.sort((a:ProjectMeta,b:ProjectMeta)=>b.updatedAt.localeCompare(a.updatedAt)));});},
  async read(id:string):Promise<Document>{return transaction(['projects','documents'],'readonly',(t,done,fail)=>{const m=t.objectStore('projects').get(id);m.onsuccess=()=>{if(!m.result){fail(Error('Proyecto no encontrado.'));return;}const p=t.objectStore('documents').get(id);p.onsuccess=()=>{try{done({meta:m.result,project:clean(p.result.project)});}catch(e){fail(Error('No se pudo leer este proyecto. Sus datos no se han sustituido.'));}};};});},
  async activate(id:string){return transaction<void>(['projects','settings'],'readwrite',(t,done,fail)=>{const r=t.objectStore('projects').get(id);r.onsuccess=()=>{if(!r.result||r.result.deletedAt){fail(Error('Restaura primero el proyecto de la papelera.'));return;}t.objectStore('settings').put(id,'active');done();};});},
  async create(project:Project,tags:string[]=[],folder=''):Promise<Document>{const d=make(project,tags,folder);return transaction(['projects','documents','versions'],'readwrite',(t,done)=>{write(t,d);version(t,d,'Inicio del proyecto');done(d);});},
  async save(id:string,expected:number,project:Project,details?:{tags:string[];folder:string}):Promise<Document>{const p=clean(project),org=details?organization(details.tags,details.folder):undefined;return transaction(['projects','documents','versions'],'readwrite',(t,done,fail)=>{const m=t.objectStore('projects').get(id);m.onsuccess=()=>{
   const meta=m.result as ProjectMeta;if(!meta||meta.deletedAt||meta.revision!==expected){fail(new ConflictError());return;}
   const r=t.objectStore('documents').get(id);r.onsuccess=()=>{const now=date();if(now!==meta.updatedAt&&Date.parse(now)-Date.parse(meta.checkpointAt)>=300000){version(t,{meta,project:r.result.project},'Recuperación automática',true);meta.checkpointAt=now;
     const old=t.objectStore('versions').index('projectId').getAll(id);old.onsuccess=()=>{const automatic=(old.result as ProjectVersion[]).filter(v=>v.automatic).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));for(const v of automatic.slice(20))t.objectStore('versions').delete(v.id);};}
    const d={project:p,meta:{...meta,...org,name:p.name,updatedAt:now,revision:expected+1,preview:previewOf(p)}};write(t,d);done(d);
   };};});},
  async checkpoint(id:string,expected:number,label:string):Promise<ProjectVersion>{return transaction(['projects','documents','versions'],'readwrite',(t,done,fail)=>{const m=t.objectStore('projects').get(id);m.onsuccess=()=>{if(!m.result||m.result.revision!==expected){fail(new ConflictError());return;}const r=t.objectStore('versions').index('projectId').getAll(id);r.onsuccess=()=>{if(r.result.filter((v:ProjectVersion)=>!v.automatic).length>=100){fail(Error('Límite de 100 versiones manuales. Exporta el proyecto o duplica para continuar su historial.'));return;}const p=t.objectStore('documents').get(id);p.onsuccess=()=>done(version(t,{meta:m.result,project:p.result.project},label));};};});},
  async versions(id:string):Promise<ProjectVersion[]>{return transaction(['versions'],'readonly',(t,done)=>{const r=t.objectStore('versions').index('projectId').getAll(id);r.onsuccess=()=>done(r.result.sort((a:ProjectVersion,b:ProjectVersion)=>b.createdAt.localeCompare(a.createdAt)));});},
  async snapshot(id:string):Promise<{document:Document;versions:ProjectVersion[]}>{return transaction(['projects','documents','versions'],'readonly',(t,done,fail)=>{const m=t.objectStore('projects').get(id);m.onsuccess=()=>{if(!m.result){fail(Error('Proyecto no encontrado.'));return;}const p=t.objectStore('documents').get(id);p.onsuccess=()=>{const v=t.objectStore('versions').index('projectId').getAll(id);v.onsuccess=()=>{try{done({document:{meta:m.result,project:clean(p.result.project)},versions:v.result});}catch(e){fail(e as Error);}};};};});},
  async restoreBackup(input:unknown):Promise<Document>{const b=validateBackup(input),d=make({...b.document.project,name:`${b.document.project.name.slice(0,75)} · recuperado`},b.document.tags,b.document.folder);return transaction(['projects','documents','versions'],'readwrite',(t,done)=>{write(t,d);for(const v of b.versions)t.objectStore('versions').put({...v,id:uid(),projectId:d.meta.id});done(d);});},
  async trash(id:string,deleted:boolean){return transaction<void>(['projects','settings'],'readwrite',(t,done,fail)=>{const active=t.objectStore('settings').get('active');active.onsuccess=()=>{if(deleted&&active.result===id){fail(Error('Abre otro proyecto antes de enviar el actual a la papelera.'));return;}const r=t.objectStore('projects').get(id);r.onsuccess=()=>{if(!r.result){fail(Error('Proyecto no encontrado.'));return;}t.objectStore('projects').put({...r.result,deletedAt:deleted?date():null,revision:r.result.revision+1});done();};};});}
 };
}
export const projectStore=createProjectStore();
