import {clone,newProject,parseProject,stats,uid} from './engine.js';
// Incoming pieces never retain layer IDs that belong to another project.
export function incorporatePieces(project,pieces,mode,name,recipe){
 const next=clone(project),incoming=clone(pieces);
 if(!incoming.length)throw Error('No hay piezas seleccionadas.');
 if((mode==='new'?0:next.pieces.length)+incoming.length>100)throw Error('Límite: 100 piezas.');
 let layerId='base';
 if(mode==='new'){
  next.name=name.slice(0,100);next.layers=newProject().layers;next.activeLayerId='base';
  next.draftingAids=[];next.pieces=[];next.annotations=[];next.guides=[];next.designDrafts=[];
 }else{
  if(next.layers.length>=30)throw Error('Límite: 30 capas. Elimina una capa vacía antes de incorporar el diseño.');
  layerId=uid();next.layers.push({id:layerId,name:name.slice(0,100),type:'drawing',visible:true,locked:false,opacity:1});next.activeLayerId=layerId;
  const right=Math.max(0,...next.pieces.map(p=>p.x+stats(p).maxX)),left=Math.min(...incoming.map(p=>p.x+stats(p).minX));
  for(const p of incoming)p.x+=right+8-left;
 }
 for(const p of incoming){p.id=uid();p.layerId=layerId;p.locked=false;}
 next.pieces.push(...incoming);
 if(recipe)next.designDrafts=[...(next.designDrafts||[]),clone(recipe)].slice(-100);
 next.scaleChecked=false;
 return parseProject(JSON.stringify(next));
}
