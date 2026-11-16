import type {Piece} from './types';
export type ImportResult={pieces:Piece[];warnings:string[];unitLabel:string};
export function importPattern(text:string,format:string,options?:{unit?:string;factor?:number}):ImportResult;
export function importSvg(text:string,options?:{unit?:string;factor?:number}):ImportResult;
export function importDxf(text:string,options?:{unit?:string;factor?:number}):ImportResult;
