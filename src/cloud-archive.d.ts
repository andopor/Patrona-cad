import type {Project} from './types';
import type {Document,ProjectVersion} from './project-store';
import type {SupabaseClient} from '@supabase/supabase-js';
export type Backup={schemaVersion:1;document:{project:Project;tags:string[];folder:string};versions:{label:string;automatic:boolean;createdAt:string;project:Project}[]};
export const MAX_BACKUP_BYTES:number;
export function validateBackup(input:unknown):Backup;
export function packBackup(document:Document,versions:ProjectVersion[]):Backup;
export function backupHash(payload:Backup):Promise<string>;
export function uploadBackup(client:SupabaseClient,userId:string,projectId:string,payload:Backup):Promise<string>;
