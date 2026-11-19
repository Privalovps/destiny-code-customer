import 'server-only';
import { appOrigin, developmentCheckoutEnabled } from './config';
import { ServiceError } from './contracts';
export const privateHeaders={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
export function sameOrigin(request:Request){if(request.headers.get('origin')!==appOrigin())throw new ServiceError(403,'Request origin is not allowed.');}
export function localOnly(request:Request){if(!developmentCheckoutEnabled()||!['localhost','127.0.0.1','[::1]'].includes(new URL(request.url).hostname))throw new ServiceError(404,'Not found.');sameOrigin(request);}
export async function boundedBody(request:Request,limit=8192){
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new ServiceError(413,'Request is too large.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export async function jsonBody(request:Request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ServiceError(415,'Use JSON.');try{return JSON.parse(new TextDecoder().decode(await boundedBody(request)));}catch(error){if(error instanceof ServiceError)throw error;throw new ServiceError(400,'Invalid request.');}}
export function failure(error:unknown){return Response.json({error:error instanceof ServiceError?error.message:'The service is temporarily unavailable.'},{status:error instanceof ServiceError?error.status:503,headers:privateHeaders});}
