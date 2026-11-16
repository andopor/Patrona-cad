import {segmentPoint,nearestSegment} from './vector.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function advancedSnap(paths,guides,p,{grid=true,magnetic=true,radius=.5,step=.5,targets={},last}={}){
 const enabled={vertices:true,midpoints:false,centers:false,edges:true,guides:true,intersections:false,...targets};
 const out=grid?{x:Math.round(p.x/step)*step,y:Math.round(p.y/step)*step}:{...p},fallback={point:out,label:grid?`Rejilla ${step} cm`:'',key:''};if(!magnetic)return fallback;
 const candidates=[],near=[];const add=(point,label,key,priority=0)=>{const d=distance(point,p);if(d<=radius*1.4)candidates.push({point,label,key,d,priority});};
 for(const path of paths){const nodes=path.nodes;if(!nodes.length)continue;const b=path.bounds;if(b&&(p.x<b.minX-radius*1.4||p.x>b.maxX+radius*1.4||p.y<b.minY-radius*1.4||p.y>b.maxY+radius*1.4))continue;
  if(enabled.vertices)nodes.forEach((n,i)=>add({x:n.x,y:n.y},`Vértice · ${path.label}`,`${path.key}:v${i}`,1));
  if(enabled.centers){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(let i=1;i<nodes.length;i++)for(let j=0;j<=8;j++){const q=segmentPoint(nodes,i,j/8);minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);minY=Math.min(minY,q.y);maxY=Math.max(maxY,q.y);}add({x:(minX+maxX)/2,y:(minY+maxY)/2},`Centro de caja · ${path.label}`,`${path.key}:center`,1);}
  for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i];if(enabled.midpoints)add(segmentPoint(nodes,i,.5),`Punto medio · ${path.label}`,`${path.key}:m${i}`,1);
   const controls=[a,b,...(b.c1?[b.c1,b.c2]:[])];if(p.x<Math.min(...controls.map(q=>q.x))-radius*1.4||p.x>Math.max(...controls.map(q=>q.x))+radius*1.4||p.y<Math.min(...controls.map(q=>q.y))-radius*1.4||p.y>Math.max(...controls.map(q=>q.y))+radius*1.4)continue;
   const edge=[{type:'M',x:a.x,y:a.y},b];if(enabled.edges){const n=nearestSegment(edge,p);add(segmentPoint(edge,1,n.t),`Borde · ${path.label}`,`${path.key}:e${i}`);}
   if(enabled.intersections&&near.length<256){const count=b.type==='C'?24:1;for(let j=0;j<count;j++){const u=segmentPoint(edge,1,j/count),v=segmentPoint(edge,1,(j+1)/count);if(Math.min(u.x,v.x)<=p.x+radius&&Math.max(u.x,v.x)>=p.x-radius&&Math.min(u.y,v.y)<=p.y+radius&&Math.max(u.y,v.y)>=p.y-radius)near.push({a:u,b:v,nodes:edge,t0:j/count,t1:(j+1)/count,key:`${path.key}:e${i}`});}}
  }
 }
 const visibleGuides=guides;
 if(enabled.guides)for(const g of visibleGuides)add(g.axis==='x'?{x:g.value,y:p.y}:{x:p.x,y:g.value},g.axis==='x'?'Guía vertical':'Guía horizontal',g.key);
 if(enabled.intersections||enabled.guides){
  const xs=visibleGuides.filter(g=>g.axis==='x'&&Math.abs(g.value-p.x)<radius),ys=visibleGuides.filter(g=>g.axis==='y'&&Math.abs(g.value-p.y)<radius);for(const x of xs)for(const y of ys)add({x:x.value,y:y.value},'Intersección de guías',`${x.key}:${y.key}`,2);
  if(enabled.intersections)for(const g of visibleGuides){if(Math.abs(g.value-p[g.axis])>radius)continue;for(const e of near){const da=e.a[g.axis]-g.value,db=e.b[g.axis]-g.value;if(da*db>0||Math.abs(da-db)<1e-10)continue;let lo=e.t0,hi=e.t1;for(let k=0;k<30;k++){const mid=(lo+hi)/2;if((segmentPoint(e.nodes,1,mid)[g.axis]-g.value)*da>0)lo=mid;else hi=mid;}add(segmentPoint(e.nodes,1,(lo+hi)/2),'Intersección guía / borde',`${g.key}:${e.key}`,2);}}
  if(enabled.intersections)for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){const a=near[i],b=near[j];if(a.key===b.key)continue;const dx=a.b.x-a.a.x,dy=a.b.y-a.a.y,ex=b.b.x-b.a.x,ey=b.b.y-b.a.y,det=dx*ey-dy*ex;if(Math.abs(det)<1e-10)continue;const qx=b.a.x-a.a.x,qy=b.a.y-a.a.y,u=(qx*ey-qy*ex)/det,v=(qx*dy-qy*dx)/det;if(u<0||u>1||v<0||v>1)continue;let t=a.t0+(a.t1-a.t0)*u,s=b.t0+(b.t1-b.t0)*v;
   for(let k=0;k<12;k++){const q=segmentPoint(a.nodes,1,t),r=segmentPoint(b.nodes,1,s),h=.00001,qa=segmentPoint(a.nodes,1,Math.min(1,t+h)),qb=segmentPoint(a.nodes,1,Math.max(0,t-h)),ra=segmentPoint(b.nodes,1,Math.min(1,s+h)),rb=segmentPoint(b.nodes,1,Math.max(0,s-h)),ax=(qa.x-qb.x)/(Math.min(1,t+h)-Math.max(0,t-h)),ay=(qa.y-qb.y)/(Math.min(1,t+h)-Math.max(0,t-h)),bx=(ra.x-rb.x)/(Math.min(1,s+h)-Math.max(0,s-h)),by=(ra.y-rb.y)/(Math.min(1,s+h)-Math.max(0,s-h)),d=ax*by-ay*bx;if(Math.abs(d)<1e-10)break;const fx=r.x-q.x,fy=r.y-q.y;t=Math.max(0,Math.min(1,t+(fx*by-fy*bx)/d));s=Math.max(0,Math.min(1,s+(fx*ay-fy*ax)/d));}
   const q=segmentPoint(a.nodes,1,t),r=segmentPoint(b.nodes,1,s);if(distance(q,r)<1e-5)add(q,'Intersección de bordes',[a.key,b.key].sort().join(':'),2);
  }
 }
 // Keep a captured target until leaving its release radius; switch only to a clearly closer target.
 const eligible=candidates.filter(c=>c.d<=radius).sort((a,b)=>(a.d-a.priority*radius*.2)-(b.d-b.priority*radius*.2)),previous=last?.key?candidates.find(c=>c.key===last.key):null;
 let best=eligible[0];if(previous&&!(best&&best.priority>previous.priority&&best.d<=radius*.35)&&(!best||best.key===previous.key||best.d>=previous.d*.6))best=previous;
 if(!best)return fallback;return {point:best.point,label:best.label,key:best.key};
}
