// The view uses SVG xMidYMid meet: account for letterboxing at every scale.
export function screenPoint(view, rect, point) {
 const scale=Math.min(rect.width/view.w,rect.height/view.h);
 return {x:view.x+(point.x-rect.left-(rect.width-view.w*scale)/2)/scale,y:view.y+(point.y-rect.top-(rect.height-view.h*scale)/2)/scale};
}
export function gestureView(base, rect, start, current) {
 const center=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
 const distance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
 const ratio=Math.max(.005,Math.min(200,distance(start)/Math.max(1,distance(current))));
 const factor=Math.max(Math.max(5/base.w,5/base.h),Math.min(Math.min(1000/base.w,1000/base.h),ratio));
 const anchor=screenPoint(base,rect,center(start)),next={...base,w:base.w*factor,h:base.h*factor};
 const at=screenPoint(next,rect,center(current));
 return {...next,x:next.x+anchor.x-at.x,y:next.y+anchor.y-at.y};
}
