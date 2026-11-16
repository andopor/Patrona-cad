import test from 'node:test';import assert from 'node:assert/strict';
import {newProject,parseProject} from '../src/engine.js';
import {aidNodes,aidEdge,snapPoint} from '../src/drafting.js';
import {segmentPoint,writeVector} from '../src/vector.js';
import {svgExport,pdfExport} from '../src/export.js';
import {advancedSnap} from '../src/snapping.js';
import {pixelScale,aidPivot,rotateAid,transformAidGesture,edgePortion,stabilizePoint,normalizedPressure,inkSegments,inputPreferences} from '../src/assisted.js';
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),pointNear=(a,b,e=1e-6)=>{near(a.x,b.x,e);near(a.y,b.y,e);};
const aid={id:'r',type:'hip',x:15,y:15,rotation:27,scale:1.5,visible:true,locked:false};
const path={key:'line',label:'Recta',nodes:[{type:'M',x:0,y:0},{type:'L',x:10,y:0}]};
test('magnetic targets can be enabled independently and grid step is configurable',()=>{
 for(const [key,p,label] of [['vertices',{x:.1,y:.1},'Vértice'],['midpoints',{x:5.1,y:.1},'Punto medio'],['centers',{x:5.1,y:.1},'Centro'],['edges',{x:3,y:.1},'Borde']]){
 const off={vertices:false,midpoints:false,centers:false,edges:false,guides:false,intersections:false};const result=advancedSnap([path],[],p,{grid:false,radius:.3,targets:{...off,[key]:true}});assert.ok(result.label.startsWith(label),result.label);
 assert.equal(advancedSnap([path],[],p,{grid:false,radius:.3,targets:off}).label,'');
 }
 assert.deepEqual(advancedSnap([],[],{x:1.18,y:2.38},{magnetic:false,step:.25}).point,{x:1.25,y:2.5});
});
test('nearest guide wins and two nearby axes meet at their actual intersection',()=>{
 const guides=[{key:'a',axis:'x',value:10},{key:'b',axis:'x',value:10.4},{key:'y',axis:'y',value:20}];
 const result=advancedSnap([],guides,{x:10.09,y:19.95},{grid:false,radius:.5,targets:{intersections:true}});pointNear(result.point,{x:10,y:20});assert.ok(result.label.includes('Intersección'));
});
test('capture hysteresis keeps a target through small boundary jitter then releases',()=>{
 const paths=[{key:'a',label:'a',nodes:[{type:'M',x:0,y:0}]},{key:'b',label:'b',nodes:[{type:'M',x:1,y:0}]}];
 const first=advancedSnap(paths,[],{x:.45,y:0},{grid:false,radius:.6});const held=advancedSnap(paths,[],{x:.51,y:0},{grid:false,radius:.6,last:first});assert.equal(held.key,first.key);
 const changed=advancedSnap(paths,[],{x:.95,y:0},{grid:false,radius:.6,last:held});assert.notEqual(changed.key,first.key);
});
test('curve/line and curve/guide intersections converge to exact Bézier points',()=>{
 const curve={key:'c',label:'Curva',nodes:[{type:'M',x:0,y:0},{type:'C',x:10,y:10,c1:{x:0,y:10},c2:{x:10,y:0}}]},cross={key:'l',label:'L',nodes:[{type:'M',x:0,y:5},{type:'L',x:10,y:5}]},targets={vertices:false,midpoints:false,centers:false,edges:false,guides:false,intersections:true};
 const result=advancedSnap([curve,cross],[],{x:5.1,y:5.1},{grid:false,radius:.5,targets});pointNear(result.point,{x:5,y:5},.0001);assert.ok(result.label.includes('Intersección'));
 const guide=advancedSnap([curve],[{key:'g',axis:'x',value:5}],{x:5.1,y:5.1},{grid:false,radius:.5,targets});pointNear(guide.point,{x:5,y:5},.0001);
});
test('pixel capture radius respects letterboxing in portrait and landscape',()=>{
 const view={w:100,h:80};near(pixelScale(view,{width:1000,height:400}),5);near(pixelScale(view,{width:768,height:1000}),7.68);near((12/pixelScale(view,{width:1000,height:400}))*5,12);
});
test('rotation keeps aid center fixed, snaps angles, normalizes multiple turns',()=>{
 const center=aidPivot(aid).world;for(const angle of [0,15,90,-179,725])pointNear(aidPivot(rotateAid(aid,angle)).world,center);near(rotateAid(aid,43,15).rotation,45);
});
test('two finger rotation/translation keeps size unless scaling is explicitly enabled',()=>{
 const start=[{x:0,y:0},{x:10,y:0}],current=[{x:20,y:30},{x:20,y:50}],out=transformAidGesture(aid,start,current);near(out.rotation,117);near(out.scale,aid.scale);
 const pivot=aidPivot(aid).world;pointNear(aidPivot(out).world,{x:20-pivot.y,y:40+pivot.x-5});near(transformAidGesture(aid,start,current,true).scale,3);
 assert.deepEqual(transformAidGesture({...aid,locked:true},start,current,true),{...aid,locked:true});
});
test('chosen curve portions preserve exact coordinates and cubic derivatives in either direction',()=>{
 const edge=aidEdge(aid,1);for(const [a,b] of [[.2,.8],[.8,.2],[0,1],[1,0],[.5,1]]){const portion=edgePortion(edge,a,b);assert.equal(portion.length,2);for(let i=0;i<=10;i++)pointNear(segmentPoint(portion,1,i/10),segmentPoint(edge,1,a+(b-a)*i/10),.00001);}
 assert.deepEqual(edgePortion(edge,.5,.5),[]);
});
test('stabilizer suppresses jitter and stylus normalization handles absent pressure',()=>{
 const last={x:0,y:0},p={x:10,y:4};assert.deepEqual(stabilizePoint(last,p,0),p);const next=stabilizePoint(last,p,.85);assert.ok(next.x>0&&next.x<4);near(normalizedPressure('mouse',0),.5);near(normalizedPressure('pen',0),.5);near(normalizedPressure('pen',.8),.8);
 assert.equal(inputPreferences(null).radiusPx,12);assert.equal(inputPreferences({inkWidth:200,angleStep:13}).inkWidth,.08);
});
test('pressure changes only visual width; JSON SVG PDF preserve ink and invalid ink is rejected',()=>{
 const p=newProject(),a={type:'path',a:{x:0,y:0},b:{x:10,y:0},outline:[{type:'M',x:0,y:0},{type:'L',x:5,y:0},{type:'L',x:10,y:0}],closed:false,ink:{width:.1,pressures:[.1,.4,.9]}};p.annotations=[a];const parts=inkSegments(a);assert.ok(parts[0].width<parts[1].width);assert.deepEqual(parts[0].nodes[0],a.outline[0]);assert.deepEqual(parseProject(JSON.stringify(p)).annotations[0].ink,a.ink);
 p.scaleChecked=true;const svg=svgExport(p);assert.ok(svg.includes(`stroke-width="${parts[0].width}"`));assert.ok(svg.includes(`stroke-width="${parts[1].width}"`));assert.ok(new TextDecoder().decode(pdfExport(p)).includes(`${(parts[0].width*72/2.54).toFixed(4)} w`));
 for(const ink of [{width:-1,pressures:[.1,.2,.3]},{width:.1,pressures:[2,0,0]},{width:.1,pressures:[.1]}])assert.throws(()=>parseProject(JSON.stringify({...p,annotations:[{...a,ink}]})));
 writeVector(p,'a:0',[a.outline[0],{type:'L',x:2,y:0},a.outline[1],a.outline[2]],false);assert.equal(p.annotations[0].ink.pressures.length,4);assert.doesNotThrow(()=>parseProject(JSON.stringify(p)));
});
test('hidden and excluded aids cannot attract the new magnetic targets',()=>{
 const p=newProject();p.pieces=[];p.draftingAids=[{...aid,visible:false}];assert.equal(snapPoint(p,aidPivot(aid).world,{grid:false,targets:{centers:true}}).label,'');p.draftingAids[0].visible=true;assert.equal(snapPoint(p,aidPivot(aid).world,{grid:false,exclude:'r:r',targets:{centers:true}}).label,'');
});
test('nearby point target can take over a held edge without disabling edge snapping',()=>{
 const first=advancedSnap([path],[],{x:3,y:.05},{grid:false,radius:.5,targets:{midpoints:true}});assert.ok(first.label.includes('Borde'));
 const second=advancedSnap([path],[],{x:5.05,y:.05},{grid:false,radius:.5,targets:{midpoints:true},last:first});assert.ok(second.label.includes('medio'));pointNear(second.point,{x:5,y:0});
});
