import 'server-only';
import type { Operation, Store } from './contracts';
import { ServiceError } from './contracts';
/** Supabase PostgREST RPC only. Never imported by client components. */
export class SupabaseStore implements Store {
 async call(operation:Operation,input:Record<string,unknown>):Promise<unknown>{
  const origin=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!origin||!key) throw new ServiceError(503,'Access storage is not configured.');
  const url=new URL(origin);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname)) throw new ServiceError(503,'Access storage is not configured securely.');
  let response:Response;
  try {response=await fetch(new URL('/rest/v1/rpc/dc_gateway',url),{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({operation,input}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});}
  catch {throw new ServiceError(503,'Access storage is temporarily unavailable.');}
  if(!response.ok) throw new ServiceError(503,'The access operation could not be completed.');
  return response.json();
 }
}
