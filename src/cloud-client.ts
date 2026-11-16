import {createClient} from '@supabase/supabase-js';
// Publishable key only. Ownership is enforced by Postgres RLS, never by this key.
const env=(import.meta as ImportMeta & {env:Record<string,string|undefined>}).env;
export const cloudClient=env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_PUBLISHABLE_KEY?createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{storageKey:'patrona-cad.cloud-auth.v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
