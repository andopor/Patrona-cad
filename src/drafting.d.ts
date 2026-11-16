import type {Project,Point,Node,DraftingAid} from './types';
export function constrainPoint(origin:Point|undefined,p:Point,mode?:string):Point;
export function shapeNodes(type:string,a:Point,b:Point,sides?:number,square?:boolean):Node[];
export function simplifyPoints(points:Point[],tolerance?:number):Point[];
export function smoothStroke(points:Point[],tolerance?:number):Node[];
export const aidNames:Record<DraftingAid['type'],string>;
export function aidNodes(a:DraftingAid):Node[];
export function aidEdge(a:DraftingAid,index:number):Node[];
export function snapPoint(project:Project,p:Point,options?:{index?:ReturnType<typeof createSnapIndex>;grid?:boolean;magnetic?:boolean;radius?:number;exclude?:string;step?:number;targets?:Partial<Record<'vertices'|'midpoints'|'centers'|'edges'|'guides'|'intersections',boolean>>;last?:{key?:string}}):{point:Point;label:string;key?:string};
export function selectionObject(project:Project,id:string):{locked?:boolean;layerId?:string}|undefined;
export function deleteSelection(project:Project,id:string):Project|null;

export function createSnapIndex(project:Project):{paths:unknown[];guides:unknown[]};
