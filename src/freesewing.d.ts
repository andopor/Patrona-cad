import type {DraftResult,Node,Point} from './types';
export const FS_VERSION:string;
export const measurementInfo:Record<string,[string,number,string]>;
export type OptionSpec={key:string;label:string;type:'number'|'select'|'boolean';min?:number;max?:number;step?:number;value:number|string|boolean;unit?:string;values?:string[];labels?:string[]};
export function getDesignInfo(id:string):Promise<{required:string[];options:OptionSpec[];name:string;author:string}>;
export function draftErrors(id:string,values:Record<string,number>):string[];
export function generateDesign(id:string,values:Record<string,number>,options?:Record<string,number|string|boolean>):Promise<DraftResult>;
export function convertOps(ops:unknown[],offset?:Point,close?:boolean):Node[][];

export function exampleMeasurements(id:string,required:string[]):Record<string,number>;
