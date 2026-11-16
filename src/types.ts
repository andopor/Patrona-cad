export type Point = {x:number;y:number};
export type Measures = {bust:number;waist:number;hip:number;shoulder:number;backWidth:number;torso:number;armhole:number;hipDepth:number;bustHeight:number;bustSeparation:number;ease:number;dartFront:number;dartBack:number;length:number};
export type Kind='bodice'|'skirt';
export type Node=Point & {type:'M'|'L'|'C';mode?:'corner'|'smooth'|'symmetric';c1?:Point;c2?:Point};
export type Piece={layerId?:string;id:string;kind:Kind|'custom'|'library';side:'front'|'back';name:string;x:number;y:number;rotation:number;mirror:boolean;visible:boolean;locked:boolean;copies:number;color:string;outline:Node[];darts:{a:Point;b:Point;tip:Point;bottom?:Point}[];levels:[string,number][];notes:string;modified:boolean;seamAllowance?:number;respectFold?:boolean;notches?:{id:string;position:number;depth:number;label:string}[];source?:{provider:string;designId:string;version:string;partId:string};markings?:{name:string;nodes:Node[]}[];cutOnFold?:Point[];grainline?:{a:Point;b:Point}};
export type Annotation={ink?:{width:number;pressures:number[]};layerId?:string;type:'line'|'curve'|'dimension'|'stroke'|'path';outline?:Node[];closed?:boolean;a:Point;b:Point;c?:Point;points?:Point[]};
export type Layer={id:string;name:string;type:'drawing'|'image';visible:boolean;locked:boolean;opacity:number;image?:{src:string;x:number;y:number;width:number;height:number}};
export type Project={schemaVersion:2;name:string;kind:Kind;measures:Measures;pieces:Piece[];annotations:Annotation[];guides:{layerId?:string;axis:'x'|'y';value:number}[];scaleChecked:boolean;layers:Layer[];activeLayerId:string;draftingAids?:DraftingAid[];designDrafts?:DraftRecipe[]};
export type Tool='select'|'nodes'|'pan'|'line'|'curve'|'dimension'|'guide'|'pen'|'trace'|'insert'|'remove'|'circle'|'rectangle'|'polygon';

export type DraftRecipe={designId:string;name:string;provider:string;version:string;measurements:Record<string,number>;options:Record<string,number|string|boolean>};
export type DraftResult={pieces:Piece[];recipe:DraftRecipe;warnings:string[]};

export type DraftingAid={id:string;type:'ruler'|'square'|'setSquare'|'french'|'hip';x:number;y:number;rotation:number;scale:number;visible:boolean;locked:boolean};
