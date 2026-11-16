import type {Piece,Node} from './types';
export function flattenNodes(nodes:Node[]):{x:number;y:number}[];
export function cutPaths(p:Piece):Node[][];
export function notchPaths(p:Piece):Node[][];
export function segmentLength(p:Piece,index:number):number;
export function productionErrors(p:Piece):string[];
