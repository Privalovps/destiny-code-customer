import 'server-only';
import { developmentCheckoutEnabled } from './config';
import { MemoryStore } from './memory-store';
import { SupabaseStore } from './supabase-store';
const local=globalThis as typeof globalThis & {destinyCheckoutStore?:MemoryStore};
export function store(){
 if(developmentCheckoutEnabled())return local.destinyCheckoutStore??(local.destinyCheckoutStore=new MemoryStore());
 return new SupabaseStore();
}
