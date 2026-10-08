export type Point = {x:number;y:number};
export type Measures = {bust:number;waist:number;hip:number;shoulder:number;backWidth:number;torso:number;armhole:number;hipDepth:number;bustHeight:number;bustSeparation:number;ease:number;dartFront:number;dartBack:number;length:number};
export type Kind='bodice'|'skirt';
export type Node=Point & {type:'M'|'L'|'C';c1?:Point;c2?:Point};
export type Piece={id:string;kind:Kind;side:'front'|'back';name:string;x:number;y:number;rotation:number;mirror:boolean;visible:boolean;locked:boolean;copies:number;color:string;outline:Node[];darts:{a:Point;b:Point;tip:Point;bottom?:Point}[];levels:[string,number][];notes:string;modified:boolean};
export type Annotation={type:'line'|'curve'|'dimension';a:Point;b:Point;c?:Point};
export type Project={schemaVersion:2;name:string;kind:Kind;measures:Measures;pieces:Piece[];annotations:Annotation[];guides:{axis:'x'|'y';value:number}[];scaleChecked:boolean};
export type Tool='select'|'nodes'|'pan'|'line'|'curve'|'dimension'|'guide';
