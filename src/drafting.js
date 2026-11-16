import {advancedSnap} from './snapping.js';
import {clone,layerFor,transform} from './engine.js';
import {annotationNodes,nearestSegment,segmentPoint} from './vector.js';
const point=(x,y)=>({x,y}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function constrainPoint(origin,p,mode='free'){
 if(!origin||mode==='free')return {...p};const dx=p.x-origin.x,dy=p.y-origin.y;
 if(mode==='horizontal')return point(p.x,origin.y);
 if(mode==='vertical')return point(origin.x,p.y);
 if(mode==='orthogonal')return Math.abs(dx)>=Math.abs(dy)?point(p.x,origin.y):point(origin.x,p.y);
 const angle=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4,r=Math.hypot(dx,dy);return point(origin.x+r*Math.cos(angle),origin.y+r*Math.sin(angle));
}
export function shapeNodes(type,a,b,sides=6,square=false){
 if(type==='rectangle'){let dx=b.x-a.x,dy=b.y-a.y;if(square){const d=Math.max(Math.abs(dx),Math.abs(dy));dx=(dx<0?-1:1)*d;dy=(dy<0?-1:1)*d;}return [{type:'M',...a},{type:'L',x:a.x+dx,y:a.y},{type:'L',x:a.x+dx,y:a.y+dy},{type:'L',x:a.x,y:a.y+dy},{type:'L',...a}];}
 const r=distance(a,b);if(type==='polygon'){const n=Math.min(24,Math.max(3,Math.round(sides))),angle=Math.atan2(b.y-a.y,b.x-a.x),nodes=Array.from({length:n},(_,i)=>({type:i?'L':'M',x:a.x+r*Math.cos(angle+i*2*Math.PI/n),y:a.y+r*Math.sin(angle+i*2*Math.PI/n)}));return [...nodes,{type:'L',x:nodes[0].x,y:nodes[0].y}];}
 const k=.5522847498307936;return [{type:'M',x:a.x+r,y:a.y},{type:'C',x:a.x,y:a.y+r,c1:point(a.x+r,a.y+k*r),c2:point(a.x+k*r,a.y+r)},{type:'C',x:a.x-r,y:a.y,c1:point(a.x-k*r,a.y+r),c2:point(a.x-r,a.y+k*r)},{type:'C',x:a.x,y:a.y-r,c1:point(a.x-r,a.y-k*r),c2:point(a.x-k*r,a.y-r)},{type:'C',x:a.x+r,y:a.y,c1:point(a.x+k*r,a.y-r),c2:point(a.x+r,a.y-k*r)}];
}
export function simplifyPoints(points,tolerance=.1){
 if(points.length<3||tolerance<=0)return clone(points);const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
 while(stack.length){const [start,end]=stack.pop(),a=points[start],b=points[end],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;let max=tolerance*tolerance,index=-1;
  for(let i=start+1;i<end;i++){const p=points[i],t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0,d=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;if(d>max){max=d;index=i;}}
  if(index>=0){keep.add(index);stack.push([start,index],[index,end]);}
 }return [...keep].sort((a,b)=>a-b).map(i=>({...points[i]}));
}
// Short aligned handles smooth retained vertices without adding more anchors.
// Simplification and control-point displacement each use half of the tolerance.
export function smoothStroke(points,tolerance=.1){const ps=simplifyPoints(points,tolerance/2);if(ps.length>2000)throw Error('Trazo demasiado complejo: aumenta el suavizado.');if(ps.length<=2)return ps.map((p,i)=>({...p,type:i?'L':'M'}));const nodes=[{type:'M',...ps[0],mode:'smooth'}];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],before=ps[Math.max(0,i-2)],after=ps[Math.min(ps.length-1,i+1)],dirA=point(b.x-before.x,b.y-before.y),dirB=point(after.x-a.x,after.y-a.y),h=Math.min(tolerance/2,distance(a,b)/3),la=Math.hypot(dirA.x,dirA.y)||1,lb=Math.hypot(dirB.x,dirB.y)||1;nodes.push({type:'C',...b,mode:'smooth',c1:point(a.x+dirA.x/la*h,a.y+dirA.y/la*h),c2:point(b.x-dirB.x/lb*h,b.y-dirB.y/lb*h)});}return nodes;}
export const aidNames={ruler:'Regla recta',square:'Escuadra 45°',setSquare:'Cartabón 30° / 60°',french:'Curva francesa',hip:'Curva de cadera'};
export function aidNodes(a){const type=a.type,nodes=type==='ruler'?[{type:'M',x:0,y:0},{type:'L',x:30,y:0},{type:'L',x:30,y:3},{type:'L',x:0,y:3},{type:'L',x:0,y:0}]:type==='square'||type==='setSquare'?[{type:'M',x:0,y:0},{type:'L',x:type==='square'?20:30,y:0},{type:'L',x:0,y:type==='square'?20:30/Math.sqrt(3)},{type:'L',x:0,y:0}]:type==='french'?[{type:'M',x:0,y:0},{type:'C',x:10,y:12,c1:point(1,10),c2:point(3,14)},{type:'C',x:18,y:3,c1:point(19,10),c2:point(20,6)},{type:'C',x:10,y:1,c1:point(16,-1),c2:point(11,-1)},{type:'C',x:0,y:0,c1:point(8,6),c2:point(1,8)}]:[{type:'M',x:0,y:0},{type:'C',x:12,y:40,c1:point(0,24),c2:point(10,37)},{type:'L',x:15,y:40},{type:'C',x:3,y:0,c1:point(12,35),c2:point(3,24)},{type:'L',x:0,y:0}];
 return nodes.map(n=>{const p=transform({...a,mirror:false},{x:n.x*a.scale,y:n.y*a.scale});return {...n,...p,...(n.c1?{c1:transform({...a,mirror:false},{x:n.c1.x*a.scale,y:n.c1.y*a.scale}),c2:transform({...a,mirror:false},{x:n.c2.x*a.scale,y:n.c2.y*a.scale})}:{})};});}
export function aidEdge(a,index){const nodes=aidNodes(a),i=Math.max(1,Math.min(nodes.length-1,index));return [{type:'M',x:nodes[i-1].x,y:nodes[i-1].y},clone(nodes[i])];}
export function createSnapIndex(project){
 const visible=o=>{const l=layerFor(project,o);return l.visible&&l.opacity>0;},exclude='',paths=[];
 for(const piece of project.pieces)if(piece.id!==exclude&&piece.visible&&visible(piece))paths.push({key:piece.id,nodes:piece.outline.map(n=>({...n,...transform(piece,n),...(n.c1?{c1:transform(piece,n.c1),c2:transform(piece,n.c2)}:{})})),label:'Pieza'});
 for(let i=0;i<project.annotations.length;i++)if(`a:${i}`!==exclude&&visible(project.annotations[i]))paths.push({key:`a:${i}`,nodes:annotationNodes(project.annotations[i]),label:'Trazo'});
 for(const a of project.draftingAids||[])if(`r:${a.id}`!==exclude&&a.visible)paths.push({key:`r:${a.id}`,nodes:aidNodes(a),label:aidNames[a.type]});
 for(const path of paths){const pts=path.nodes.flatMap(n=>[n,...(n.c1?[n.c1,n.c2]:[])]);path.bounds={minX:Math.min(...pts.map(p=>p.x)),maxX:Math.max(...pts.map(p=>p.x)),minY:Math.min(...pts.map(p=>p.y)),maxY:Math.max(...pts.map(p=>p.y))};}
 return {paths,guides:project.guides.map((g,i)=>({...g,key:`g:${i}`})).filter(visible)};
}
export function snapPoint(project,p,options={}){const index=options.index||createSnapIndex(project),exclude=options.exclude||'';return advancedSnap(index.paths.filter(p=>p.key!==exclude),index.guides.filter(g=>g.key!==exclude),p,options);}
export function selectionObject(project,id){if(id.startsWith('a:'))return project.annotations[Number(id.slice(2))];if(id.startsWith('g:'))return project.guides[Number(id.slice(2))];if(id.startsWith('r:'))return project.draftingAids?.find(a=>a.id===id.slice(2));if(id.startsWith('img:'))return project.layers.find(l=>l.id===id.slice(4));return project.pieces.find(p=>p.id===id);}
export function deleteSelection(project,id){const object=selectionObject(project,id);if(!object)return null;if(object.locked||(!id.startsWith('r:')&&!id.startsWith('img:')&&layerFor(project,object).locked))throw Error('El objeto o su capa están bloqueados.');const p=clone(project);if(id.startsWith('a:'))p.annotations.splice(Number(id.slice(2)),1);else if(id.startsWith('g:'))p.guides.splice(Number(id.slice(2)),1);else if(id.startsWith('r:'))p.draftingAids=p.draftingAids.filter(a=>a.id!==id.slice(2));else if(id.startsWith('img:')){if(p.layers.length===1)throw Error('Conserva al menos una capa en el proyecto.');const layerId=id.slice(4);if([...p.pieces,...p.annotations,...p.guides].some(o=>o.layerId===layerId))throw Error('La capa contiene trazos. Muévelos antes de eliminar la imagen.');p.layers=p.layers.filter(l=>l.id!==layerId);if(p.activeLayerId===layerId)p.activeLayerId=p.layers.find(l=>l.type==='drawing')?.id||p.layers[0].id;}else p.pieces=p.pieces.filter(x=>x.id!==id);return p;}
