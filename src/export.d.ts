import type {Project} from './types';
export function svgExport(s:Project):string;
export function pdfExport(s:Project,format?:'a4'|'full'):Uint8Array<ArrayBuffer>;
