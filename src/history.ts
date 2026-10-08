import type {Project} from './types';
export type History={past:Project[];present:Project;future:Project[]};
export function commit(h:History,p:Project):History {return {past:[...h.past,h.present].slice(-80),present:{...p,scaleChecked:false},future:[]};}
export function undo(h:History):History {if(!h.past.length)return h;return {past:h.past.slice(0,-1),present:h.past.at(-1)!,future:[h.present,...h.future]};}
export function redo(h:History):History {if(!h.future.length)return h;return {past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)};}
