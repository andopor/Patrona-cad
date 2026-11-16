import {useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {cloudClient as client} from './cloud-client';
import {projectStore} from './project-store';
import {backupHash,packBackup,uploadBackup,validateBackup} from './cloud-archive';
import {download} from './storage';

type Row={id:string;project_id:string;name:string;created_at:string};
type Props={open:boolean;onClose:()=>void;flush:()=>Promise<unknown>;onRestore:(id:string)=>Promise<unknown>};
const when=(s:string)=>new Date(s).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
export default function CloudArchive({open,onClose,flush,onRestore}:Props){
 const dialog=useRef<HTMLDialogElement>(null),[user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(()=>location.hash.includes('error=')?'El enlace ha caducado o ya se utilizó. Solicita un enlace nuevo para entrar.':''),[status,setStatus]=useState(''),[rows,setRows]=useState<Row[]>([]),[page,setPage]=useState(0),[auto,setAuto]=useState(false);
 const autoBackup=useRef<()=>Promise<void>>(async()=>{}),running=useRef(false),latest=useRef({flush,onRestore}),currentUser=useRef(user),hashes=useRef(new Map<string,string>());
 latest.current={flush,onRestore};currentUser.current=user;
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();if(!open)dialog.current?.close();},[open]);
 useEffect(()=>{
  if(!client){setChecking(false);return;}
  let live=true;
  client.auth.getUser().then(({data})=>{if(live){setUser(data.user);setChecking(false);}}).catch(()=>{if(live)setChecking(false);});
  const {data}=client.auth.onAuthStateChange((_event,session)=>{if(live){setUser(session?.user??null);setChecking(false);if(currentUser.current?.id!==session?.user.id){setRows([]);setPage(0);setAuto(false);hashes.current.clear();}}});
  return()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{if(!user)return;try{setAuto(localStorage.getItem(`patrona-cloud-auto:${user.id}`)==='true');}catch{}},[user?.id]);
 async function refresh(offset=page){
  if(!client||!currentUser.current)return;
  const {data,error}=await client.from('patrona_snapshots').select('id,project_id,name,created_at').eq('user_id',currentUser.current.id).order('created_at',{ascending:false}).order('id').range(offset*50,offset*50+49);
  if(error)throw Error(error.message);setRows(data||[]);
 }
 useEffect(()=>{if(!open||!user)return;let live=true;client!.from('patrona_snapshots').select('id,project_id,name,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).order('id').range(page*50,page*50+49).then(({data,error})=>{if(live){if(error)setError(error.message);else setRows(data||[]);}});return()=>{live=false;};},[open,user?.id,page]);
 async function run(fn:()=>Promise<void>){
  if(running.current)return;running.current=true;setBusy(true);setError('');
  try{await fn();}catch(e){setError((e as Error).message);}finally{running.current=false;setBusy(false);}
 }
 async function verifiedUser(){
  const {data,error}=await client!.auth.getUser();
  if(error||!data.user||data.user.id!==currentUser.current?.id)throw Error('Vuelve a entrar en tu cuenta para guardar en nube. El trabajo local se conserva.');
  return data.user;
 }
 async function backup(all=false){
  if(!client||!currentUser.current)return;
  const owner=await verifiedUser();
  const active=await latest.current.flush() as {meta:{id:string}};
  const ids=all?(await projectStore.list()).filter(p=>!p.deletedAt).map(p=>p.id):[active.meta.id];
  let count=0;
  for(const id of ids){
   if(currentUser.current?.id!==owner.id)throw Error('La cuenta cambió. Las copias ya guardadas se conservan.');
   const {document,versions}=await projectStore.snapshot(id),payload=packBackup(document,versions),key=`${owner.id}:${id}`,hash=await backupHash(payload);
   if(hashes.current.get(key)!==hash){await uploadBackup(client,owner.id,id,payload);hashes.current.set(key,hash);}count++;
   setStatus(`${count} de ${ids.length} proyecto(s) con copia en nube`);
  }
  setStatus(`Copia en nube comprobada · ${count} proyecto(s) · ${new Date().toLocaleTimeString('es-ES')}`);
  await refresh();
 }
 autoBackup.current=()=>backup();
 useEffect(()=>{
  if(!auto||!user)return;
  const retry=()=>{if(navigator.onLine)void run(()=>autoBackup.current());else setStatus('Sin conexión: guardado local activo. La copia en nube se reintentará al volver.');};
  const timer=setInterval(retry,120000);window.addEventListener('online',retry);
  return()=>{clearInterval(timer);window.removeEventListener('online',retry);};
 },[auto,user?.id]);
 async function recover(row:Row,asJSON=false){
  await verifiedUser();const {data,error}=await client!.from('patrona_snapshots').select('payload').eq('id',row.id).single();if(error)throw Error(error.message);
  const payload=validateBackup(data.payload);
  if(asJSON){download(JSON.stringify(payload.document.project,null,2),`${row.name}.json`,'application/json');return;}
  await latest.current.flush();const copy=await projectStore.restoreBackup(payload);await latest.current.onRestore(copy.meta.id);setStatus('Copia recuperada como proyecto nuevo, con su historial.');onClose();
 }
 return <dialog ref={dialog} className="projects-dialog cloud-dialog" aria-labelledby="cloud-heading" onCancel={e=>{if(busy)e.preventDefault();else onClose();}}>
  <div className="dialog-head"><div><span className="eyebrow">TU TALLER PERSONAL</span><h2 id="cloud-heading">Copias en la nube</h2></div><button aria-label="Cerrar nube" disabled={busy} onClick={onClose}>×</button></div>
  <p>Copias privadas de proyectos, fotos, medidas y versiones. El guardado local sigue funcionando. Recuperar crea un proyecto nuevo y conserva los originales.</p>
  {checking?<p role="status">Comprobando acceso…</p>:!client?<p className="warning">La conexión de nube aún no está configurada. Tus proyectos se guardan en este dispositivo.</p>:!user?<form className="project-details" onSubmit={e=>{e.preventDefault();void run(async()=>{const {error}=await client!.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:location.origin+'/'}});if(error)throw Error(error.message);setStatus('Enlace enviado. Abre el correo más reciente de Supabase y pulsa el enlace para entrar. Revisa también spam.');});}}>
   <label>Tu correo electrónico<input type="email" autoComplete="email" required aria-label="Correo para entrar en nube" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label><button className="primary" disabled={busy}>Recibir enlace de acceso</button><p className="micro">No necesitas contraseña. Supabase envía un enlace de un solo uso a tu correo. Si el proveedor de correo rechaza el envío, se indicará aquí y el guardado local continuará.</p>
  </form>:<><p><b>Cuenta:</b> {user.email}</p><div className="project-actions"><button className="primary" disabled={busy} onClick={()=>void run(()=>backup())}>Guardar actual en nube</button><button disabled={busy} onClick={()=>void run(()=>backup(true))}>Guardar todos en nube</button><button disabled={busy} onClick={()=>void run(()=>refresh())}>Actualizar copias</button><button disabled={busy} onClick={()=>void run(async()=>{const {error}=await client!.auth.signOut({scope:'local'});if(error)throw error;setStatus('Sesión cerrada en este dispositivo.');})}>Cerrar sesión</button></div>
   <label className="check-line"><input type="checkbox" checked={auto} disabled={busy} onChange={e=>{const enabled=e.target.checked;setAuto(enabled);try{localStorage.setItem(`patrona-cloud-auto:${user.id}`,String(enabled));}catch{}if(enabled)void run(()=>backup());}}/>Copia automática del proyecto actual cada 2 minutos</label><p className="micro">Funciona mientras la aplicación permanece abierta y conectada. Conserva copias anteriores; hasta 12 MB por copia. La nube tiene el límite de almacenamiento del plan de Supabase. Perfiles independientes y «Mis modelos» siguen guardándose localmente.</p>
   <h3>Copias guardadas</h3><div className="version-list">{rows.map(row=><article key={row.id}><div><b>{row.name}</b><p>{when(row.created_at)}</p></div><button disabled={busy} onClick={()=>void run(()=>recover(row))}>Recuperar como proyecto nuevo</button><button disabled={busy} onClick={()=>void run(()=>recover(row,true))}>JSON</button></article>)}</div>{!rows.length&&<p>No hay copias en esta página. Guarda un proyecto para empezar.</p>}<div className="row"><button disabled={busy||page===0} onClick={()=>setPage(p=>p-1)}>Más recientes</button><span>Página {page+1}</span><button disabled={busy||rows.length<50} onClick={()=>setPage(p=>p+1)}>Más antiguas</button></div>
  </>}
  {busy&&<p role="status">Trabajando… Mantén esta ventana abierta.</p>}{status&&<p role="status">{status}</p>}{error&&<p className="warning" role="alert">{error} El original local se conserva.</p>}
 </dialog>;
}
