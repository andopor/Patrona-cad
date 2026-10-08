import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as PE} from 'react';
import type {Project,Point,Tool,Piece,Node} from './types';
import {clone,projectBounds,localBounds,pathData} from './engine';
type View={x:number;y:number;w:number;h:number};
type Drag={start:Point;piece?:string;node?:number;control?:'c1'|'c2';base:Project;view:View;last?:Project};
export default function Canvas({project,selected,onSelect,onChange,tool,snap,grid,construction,dimensions,fitSignal,zoomSignal,onCoords,onZoom}:{project:Project;selected:string;onSelect:(id:string)=>void;onChange:(p:Project)=>void;tool:Tool;snap:boolean;grid:boolean;construction:boolean;dimensions:boolean;fitSignal:number;zoomSignal:{serial:number;factor:number};onCoords:(p:Point)=>void;onZoom:(z:number)=>void}){
 const svg=useRef<SVGSVGElement>(null),drag=useRef<Drag|null>(null),last=useRef<Project>(project);
 const [view,setView]=useState<View>({x:0,y:0,w:85,h:80}),[ghost,setGhost]=useState<Project|null>(null),[pending,setPending]=useState<Point[]>([]),[hover,setHover]=useState<Point|null>(null);
 last.current=project;
 useEffect(()=>{const b=projectBounds(last.current);setView({x:b.minX-5,y:b.minY-6,w:b.maxX-b.minX+10,h:b.maxY-b.minY+12});},[fitSignal]);
 useEffect(()=>{if(zoomSignal.serial)setView(v=>({x:v.x+v.w*(1-zoomSignal.factor)/2,y:v.y+v.h*(1-zoomSignal.factor)/2,w:Math.min(1000,Math.max(5,v.w*zoomSignal.factor)),h:Math.min(1000,Math.max(5,v.h*zoomSignal.factor))}));},[zoomSignal]);
 useEffect(()=>{onZoom(85/view.w*100);},[view.w,onZoom]);
 useEffect(()=>{setPending([]);setHover(null);},[tool,project.kind]);
 useEffect(()=>{const cancel=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPending([]);setGhost(null);drag.current=null;}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 const coord=(e:{clientX:number;clientY:number},rounded=true)=>{const matrix=svg.current?.getScreenCTM();if(!matrix)return {x:0,y:0};const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return snap&&rounded?{x:Math.round(p.x*2)/2,y:Math.round(p.y*2)/2}:{x:p.x,y:p.y};};
 const down=(e:PE<SVGSVGElement>)=>{
  if(e.button!==0)return;const p=coord(e),el=e.target as Element;const pieceId=el.closest('[data-piece]')?.getAttribute('data-piece'),piece=project.pieces.find(x=>x.id===pieceId);
  if(tool==='pan'){drag.current={start:coord(e,false),base:clone(project),view};svg.current!.setPointerCapture(e.pointerId);return;}
  if(tool==='guide'){onChange({...clone(project),guides:[...project.guides,{axis:e.shiftKey?'y':'x',value:e.shiftKey?p.y:p.x}]});return;}
  if(['line','curve','dimension'].includes(tool)){
   const next=[...pending,p],needed=tool==='curve'?3:2;if(next.length===needed){if(Math.hypot(next[0].x-next[1].x,next[0].y-next[1].y)<.05){setPending([]);return;}onChange({...clone(project),annotations:[...project.annotations,{type:tool as 'line'|'curve'|'dimension',a:next[0],b:next[1],...(needed===3?{c:next[2]}:{})}]});setPending([]);}else setPending(next);return;
  }
  if(piece){onSelect(piece.id);if(piece.locked)return;const handle=el.closest('[data-node]');if(tool==='nodes'&&!handle)return;drag.current={start:p,piece:piece.id,base:clone(project),view,...(handle?{node:Number(handle.getAttribute('data-node')),control:handle.getAttribute('data-control') as 'c1'|'c2'|undefined}: {})};svg.current!.setPointerCapture(e.pointerId);}
 };
 const move=(e:PE<SVGSVGElement>)=>{
  const p=coord(e);onCoords(p);setHover(p);const d=drag.current;if(!d)return;
  if(!d.piece){const q=coord(e,false);setView(v=>({...v,x:v.x+d.start.x-q.x,y:v.y+d.start.y-q.y}));return;}
  const next=clone(d.base),piece=next.pieces.find(a=>a.id===d.piece)!;
  if(d.node!==undefined){const r=-piece.rotation*Math.PI/180,dx=p.x-piece.x,dy=p.y-piece.y;let q={x:(dx*Math.cos(r)-dy*Math.sin(r))*(piece.mirror?-1:1),y:dx*Math.sin(r)+dy*Math.cos(r)};if(snap)q={x:Math.round(q.x*2)/2,y:Math.round(q.y*2)/2};const n=piece.outline[d.node];if(d.control)n[d.control]=q;else{n.x=q.x;n.y=q.y;const end=piece.outline.length-1;if(d.node===0){piece.outline[end].x=q.x;piece.outline[end].y=q.y;}if(d.node===end){piece.outline[0].x=q.x;piece.outline[0].y=q.y;}}piece.modified=true;
  }else{piece.x+=p.x-d.start.x;piece.y+=p.y-d.start.y;}
  d.last=next;setGhost(next);
 };
 const up=()=>{const d=drag.current;drag.current=null;setGhost(null);if(d?.last&&JSON.stringify(d.last)!==JSON.stringify(d.base))onChange(d.last);};
 const display=ghost||project,size=Math.max(.18,view.w/160),sel=display.pieces.find(p=>p.id===selected&&p.visible);
 return <div className="stage"><svg ref={svg} id="drawing" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Editor de patrones en centímetros" tabIndex={0} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setGhost(null);}}>
  <defs><pattern id="minorGrid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#dfe9ec" strokeWidth=".035"/></pattern><pattern id="majorGrid" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#minorGrid)"/><path d="M5 0H0V5" fill="none" stroke="#cbdce0" strokeWidth=".055"/></pattern><marker id="arrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse"><path d="M0 0L5 2.5L0 5" fill="none" stroke="#49868b"/></marker></defs>
  <rect x={view.x-1000} y={view.y-1000} width={view.w+2000} height={view.h+2000} fill={grid?'url(#majorGrid)':'#f2f7f8'}/>
  {display.guides.map((g,i)=><line key={i} x1={g.axis==='x'?g.value:view.x-1000} x2={g.axis==='x'?g.value:view.x+view.w+1000} y1={g.axis==='y'?g.value:view.y-1000} y2={g.axis==='y'?g.value:view.y+view.h+1000} stroke="#d4a365" strokeWidth=".09" strokeDasharray=".5 .5"/>) }
  {display.pieces.filter(p=>p.visible).map(p=><PieceDrawing key={p.id} piece={p} selected={p.id===selected} construction={construction} dimensions={dimensions}/>)}
  {display.annotations.map((a,i)=><g key={i}><path d={`M ${a.a.x} ${a.a.y} ${a.type==='curve'?`Q ${a.c!.x} ${a.c!.y}`:'L'} ${a.b.x} ${a.b.y}`} fill="none" stroke="#8d6dba" strokeWidth=".12"/>{a.type==='dimension'&&<text x={(a.a.x+a.b.x)/2} y={(a.a.y+a.b.y)/2-.6} fontSize=".8" fill="#785898">{Math.hypot(a.b.x-a.a.x,a.b.y-a.a.y).toFixed(2)} cm</text>}</g>)}
  {tool==='nodes'&&sel&&!sel.locked&&<g data-piece={sel.id} transform={`translate(${sel.x} ${sel.y}) rotate(${sel.rotation}) scale(${sel.mirror?-1:1} 1)`}>{sel.outline.slice(0,-1).map((n,i)=><g key={i}>{n.type==='C'&&(['c1','c2'] as const).map((c,j)=><g key={c}><line pointerEvents="none" x1={j===0?sel.outline[i-1].x:n.x} y1={j===0?sel.outline[i-1].y:n.y} x2={n[c]!.x} y2={n[c]!.y} stroke="#b094cf" strokeWidth=".06"/><circle data-node={i} data-control={c} className="node-control" cx={n[c]!.x} cy={n[c]!.y} r={size*.8} fill="#f2e7ff" stroke="#9b72c6" strokeWidth=".09"/></g>)}<circle data-node={i} className="node-control" cx={n.x} cy={n.y} r={size} fill="white" stroke="#138890" strokeWidth=".12"/></g>)}</g>}
  {pending.length>0&&hover&&<g pointerEvents="none"><path d={`M ${pending[0].x} ${pending[0].y} ${tool==='curve'&&pending.length===2?`Q ${hover.x} ${hover.y} ${pending[1].x} ${pending[1].y}`:`L ${hover.x} ${hover.y}`}`} fill="none" stroke="#a56bd1" strokeWidth=".1" strokeDasharray=".4 .4"/>{pending.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r=".3" fill="#a56bd1"/>)}</g>}
 </svg><div className="canvas-label"><span className="dot"/> VISTA DE PATRÓN <span>1 unidad = 1 cm</span></div></div>;
}
function PieceDrawing({piece:p,selected,construction,dimensions}:{piece:Piece;selected:boolean;construction:boolean;dimensions:boolean}){
 const b=localBounds(p),gx=(b.minX+b.maxX)/2;return <g data-piece={p.id} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.mirror?-1:1} 1)`}>
 <path className="outline" d={pathData(p.outline)} fill={p.color} fillOpacity={selected?.09:.035} stroke={p.color} strokeWidth={selected?.16:.09}/>
 {p.darts.map((d,i)=><path key={i} d={`M ${d.a.x} ${d.a.y} L ${d.tip.x} ${d.tip.y} L ${d.b.x} ${d.b.y}${d.bottom?` L ${d.bottom.x} ${d.bottom.y} Z`:''}`} fill="none" stroke={p.color} strokeWidth=".07" strokeDasharray=".3 .2" pointerEvents="none"/>)}
 {construction&&p.levels.map(([name,y])=><g key={name} pointerEvents="none"><line x1={b.minX} y1={y} x2={b.maxX} y2={y} stroke={p.color} strokeOpacity=".4" strokeDasharray=".3 .3" strokeWidth=".06"/><text x=".6" y={y-.5} fontSize=".65" fill={p.color}>{name}</text></g>)}
 <line x1={gx} y1={b.minY+12} x2={gx} y2={b.maxY-5} stroke={p.color} strokeWidth=".07" markerStart="url(#arrow)" markerEnd="url(#arrow)" pointerEvents="none"/>
 <text x={b.minX} y={b.minY-2} fontSize="1.1" fill={p.color}>{p.name}</text><text x={b.minX} y={b.maxY+1.8} fontSize=".65" fill={p.color}>Al lomo · sin margen · {p.locked?'bloqueada':p.modified?'editada':'base paramétrica'}</text>
 {dimensions&&<g pointerEvents="none" stroke="#8aa5ad" strokeWidth=".06"><path d={`M${b.minX} ${b.maxY+3}H${b.maxX} M${b.maxX+3} ${b.minY}V${b.maxY}`}/><text stroke="none" fill="#748f98" x={gx} y={b.maxY+4.4} fontSize=".75">{(b.maxX-b.minX).toFixed(1)} cm</text><text stroke="none" fill="#748f98" transform={`translate(${b.maxX+4.5} ${(b.maxY+b.minY)/2}) rotate(-90)`} fontSize=".75">{(b.maxY-b.minY).toFixed(1)} cm</text></g>}
 </g>;
}
