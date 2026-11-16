import test from 'node:test';
import assert from 'node:assert/strict';
import {screenPoint,gestureView} from '../src/viewport.js';
const base={x:10,y:20,w:100,h:80},rect={left:30,top:50,width:1000,height:600};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('two fingers pan without changing dimensions, including letterboxed SVG',()=>{
 const start=[{x:300,y:200},{x:500,y:200}],current=start.map(p=>({x:p.x+75,y:p.y-30}));
 const next=gestureView(base,rect,start,current);close(next.w,base.w);close(next.h,base.h);close(next.x,0);close(next.y,24);
});
test('pinch doubles zoom and preserves world anchor under moving midpoint',()=>{
 const start=[{x:300,y:200},{x:500,y:200}],current=[{x:250,y:250},{x:650,y:250}];
 const next=gestureView(base,rect,start,current);close(next.w,50);close(next.h,40);
 const anchor=screenPoint(base,rect,{x:400,y:200}),at=screenPoint(next,rect,{x:450,y:250});close(anchor.x,at.x);close(anchor.y,at.y);
});
test('returning fingers to original positions restores view without accumulated drift',()=>{
 const start=[{x:300,y:200},{x:500,y:200}];assert.deepEqual(gestureView(base,rect,start,start),base);
});
test('pinch bounds preserve aspect ratio and finite coordinates',()=>{
 for(const distance of [0,.001,1,100000]){
 const next=gestureView(base,rect,[{x:0,y:0},{x:200,y:0}],[{x:0,y:0},{x:distance,y:0}]);
 assert.ok(Object.values(next).every(Number.isFinite));assert.ok(next.w<=1000&&next.h<=1000&&next.w>=5&&next.h>=5);close(next.w/next.h,base.w/base.h);
 }
});
test('portrait and landscape frames keep the pinch center anchored',()=>{
 for(const frame of [{left:0,top:0,width:768,height:850},{left:10,top:20,width:1024,height:530}]){
 const start=[{x:230,y:310},{x:350,y:410}],current=[{x:100,y:210},{x:500,y:510}];const next=gestureView(base,frame,start,current);
 const a=screenPoint(base,frame,{x:290,y:360}),b=screenPoint(next,frame,{x:300,y:360});close(a.x,b.x);close(a.y,b.y);
 }
});
