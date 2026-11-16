import type {Project,Piece,DraftRecipe} from './types';
export function incorporatePieces(project:Project,pieces:Piece[],mode:'new'|'add',name:string,recipe?:DraftRecipe):Project;
