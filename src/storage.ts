import {newProject,parseProject} from './engine';
import type {Project,Measures} from './types';
export const STORAGE_KEY='patrona-cad.project.v2';
export function loadProject():{project:Project;message:string} {try {const raw=localStorage.getItem(STORAGE_KEY);return {project:raw?parseProject(raw):newProject(),message:raw?'Proyecto recuperado de este navegador':'Proyecto nuevo'};}catch{return {project:newProject(),message:'No se pudo recuperar el proyecto local. El archivo guardado no se ha sobrescrito; descarga JSON para conservar tu trabajo.'};}}
export function saveProject(p:Project):boolean {try {localStorage.setItem(STORAGE_KEY,JSON.stringify({...p,scaleChecked:false}));return true;}catch{return false;}}
export type Profile={id:string;name:string;measures:Measures};
export function loadProfiles():Profile[] {try {const raw=JSON.parse(localStorage.getItem('patrona-cad.profiles.v2')||'[]');if(!Array.isArray(raw))return [];return raw.filter(x=>typeof x.id==='string'&&typeof x.name==='string'&&x.measures).slice(0,30);}catch{return [];}}
export function saveProfiles(p:Profile[]):boolean {try{localStorage.setItem('patrona-cad.profiles.v2',JSON.stringify(p));return true;}catch{return false;}}
export function download(data:BlobPart,name:string,mime:string){const u=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}
