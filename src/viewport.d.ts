type Point={x:number;y:number};
type View={x:number;y:number;w:number;h:number};
type Rect={left:number;top:number;width:number;height:number};
export function screenPoint(view:View,rect:Rect,point:Point):Point;
export function gestureView(base:View,rect:Rect,start:Point[],current:Point[]):View;
