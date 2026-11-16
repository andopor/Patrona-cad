import {parseProject} from './engine.js';

export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export function validateBackup(input) {
 if (!input || input.schemaVersion !== 1 || !input.document || !Array.isArray(input.versions) || input.versions.length > 120) throw Error('Copia de nube no compatible. No se han cambiado tus proyectos.');
 const d=input.document;
 if (!Array.isArray(d.tags) || d.tags.length>12 || d.tags.some(t=>typeof t!=='string'||t.length>60) || typeof d.folder!=='string'||d.folder.length>60) throw Error('Organización de la copia no válida.');
 const project=p=>parseProject(JSON.stringify(p));
 return {schemaVersion:1,document:{project:project(d.project),tags:d.tags,folder:d.folder},versions:input.versions.map(v=>{
  if(!v||typeof v.label!=='string'||v.label.length>100||typeof v.automatic!=='boolean'||!Number.isFinite(Date.parse(v.createdAt)))throw Error('Historial de la copia no válido.');
  return {label:v.label,automatic:v.automatic,createdAt:v.createdAt,project:project(v.project)};
 })};
}
export function packBackup(document,versions){
 const payload=validateBackup({schemaVersion:1,document:{project:document.project,tags:document.meta.tags,folder:document.meta.folder},versions:versions.map(({label,automatic,createdAt,project})=>({label,automatic,createdAt,project}))});
 if(new TextEncoder().encode(JSON.stringify(payload)).length>MAX_BACKUP_BYTES)throw Error('Esta copia supera 12 MB, incluidas fotos e historial. Descarga JSON y reduce las imágenes antes de guardar en la nube. El original local se conserva.');
 return payload;
}
export async function backupHash(payload){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function uploadBackup(client,userId,projectId,payload){
 const content_hash=await backupHash(payload);
 const row={user_id:userId,project_id:projectId,name:payload.document.project.name,content_hash,payload};
 const {error}=await client.from('patrona_snapshots').insert(row);
 // Unique immutable content makes a retry safe after a lost network response.
 if(error&&error.code!=='23505')throw Error(error.message||'No se pudo guardar la copia en nube. El original local se conserva.');
 return content_hash;
}
