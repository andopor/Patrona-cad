import {useCallback,useEffect,useRef,useState} from 'react';
import {projectStore,ConflictError} from './project-store';
import type {Document,ProjectMeta,ProjectVersion} from './project-store';
import type {Project} from './types';

export default function useProjectArchive(project:Project,onLoad:(p:Project)=>void,onNotice:(s:string)=>void){
 const [meta,setMeta]=useState<ProjectMeta|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('Abriendo archivo local…');
 const current=useRef<Document|null>(null),latest=useRef(project),saved=useRef(''),queue=useRef<Promise<unknown>>(Promise.resolve()),mounted=useRef(true),loader=useRef(onLoad),notice=useRef(onNotice);
 latest.current=project;loader.current=onLoad;notice.current=onNotice;
 const install=useCallback((d:Document,load=false)=>{current.current=d;saved.current=JSON.stringify(d.project);setMeta(d.meta);if(load){latest.current=d.project;loader.current(d.project);}},[]);
 const serial=useCallback(<T,>(fn:()=>Promise<T>):Promise<T>=>{const next=queue.current.then(fn);queue.current=next.catch(()=>{});return next;},[]);
 const persist=useCallback(async()=>{
  const d=current.current;if(!d)throw Error('El archivo local aún no está disponible. Puedes descargar JSON.');
  const p=latest.current;if(JSON.stringify(p)===saved.current)return d;
  try{const result=await projectStore.save(d.meta.id,d.meta.revision,p);install(result);setStatus('Guardado en este dispositivo');return result;}
  catch(e){if(e instanceof ConflictError){const copy=await projectStore.create({...p,name:`${p.name.slice(0,75)} · copia por conflicto`},d.meta.tags,d.meta.folder);await projectStore.activate(copy.meta.id);install(copy);const live={...latest.current,name:copy.project.name};latest.current=live;loader.current(live);setStatus('Conflicto conservado en una copia');notice.current('Otra pestaña cambió el proyecto. Se han conservado ambas versiones; tu trabajo está en una copia.');return copy;}throw e;}
 },[install]);
 const report=useCallback((e:unknown)=>{const message=(e as Error).message;setStatus(message);notice.current(message);},[]);
 const flush=useCallback(()=>serial(persist).catch(e=>{report(e);throw e;}),[serial,persist,report]);
 useEffect(()=>{mounted.current=true;projectStore.bootstrap(latest.current).then(d=>{if(!mounted.current)return;install(d,true);setReady(true);setStatus('Guardado en este dispositivo');}).catch(report);return()=>{mounted.current=false;};},[install,report]);
 useEffect(()=>{if(!ready||JSON.stringify(project)===saved.current)return;setStatus('Cambios pendientes de guardar…');const t=setTimeout(()=>{void flush().catch(()=>{});},500);return()=>clearTimeout(t);},[project,ready,flush]);
 useEffect(()=>{const save=()=>{if(current.current)void flush().catch(()=>{});};const visibility=()=>{if(document.visibilityState==='hidden')save();};const before=(e:BeforeUnloadEvent)=>{if(current.current&&JSON.stringify(latest.current)!==saved.current){e.preventDefault();e.returnValue='';}};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',save);window.addEventListener('beforeunload',before);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',save);window.removeEventListener('beforeunload',before);};},[flush]);
 const action=useCallback(async<T,>(fn:()=>Promise<T>)=>{setBusy(true);try{return await serial(async()=>{await persist();return fn();});}catch(e){report(e);throw e;}finally{setBusy(false);}},[serial,persist,report]);
 const open=useCallback((id:string)=>action(async()=>{const d=await projectStore.read(id);await projectStore.activate(id);install(d,true);setStatus('Guardado en este dispositivo');}),[action,install]);
 const create=useCallback((p:Project)=>action(async()=>{const d=await projectStore.create(p);await projectStore.activate(d.meta.id);install(d,true);setStatus('Guardado en este dispositivo');}),[action,install]);
 const checkpoint=useCallback((label:string)=>action(async()=>{const d=current.current!;await projectStore.checkpoint(d.meta.id,d.meta.revision,label);notice.current('Versión guardada. Podrás recuperarla después de cerrar Safari.');}),[action]);
 const restore=useCallback((version:ProjectVersion)=>action(async()=>{const d=current.current!;if(version.projectId!==d.meta.id)throw Error('El proyecto activo cambió. Vuelve a abrir su historial.');await projectStore.checkpoint(d.meta.id,d.meta.revision,'Antes de restaurar · '+version.label.slice(0,65));const result=await projectStore.save(d.meta.id,d.meta.revision,version.project);install(result,true);setStatus('Versión restaurada y guardada');}),[action,install]);
 const details=useCallback((name:string,tags:string[],folder:string)=>action(async()=>{const d=current.current!;const result=await projectStore.save(d.meta.id,d.meta.revision,{...latest.current,name},{tags,folder});install(result,true);setStatus('Guardado en este dispositivo');}),[action,install]);
 return {meta,ready,busy,status,flush,open,create,checkpoint,restore,details};
}
