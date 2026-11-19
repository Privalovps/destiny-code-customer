import { z } from 'zod';
import { commerceEnvironment } from '@/lib/server/config';
import { ServiceError } from '@/lib/server/contracts';
import { failure, jsonBody, privateHeaders, sameOrigin } from '@/lib/server/http';
import { emailProvider } from '@/lib/server/providers';
import { store } from '@/lib/server/store';
import { tokenHash } from '@/lib/server/tokens';
export async function POST(request:Request){try{
 sameOrigin(request);if(!emailProvider())throw new ServiceError(503,'Email recovery is not available yet.');
 const input=z.object({email:z.email().max(254).transform(v=>v.toLowerCase())}).strict().safeParse(await jsonBody(request));
 if(!input.success)throw new ServiceError(400,'Enter a valid email address.');
 const database=store();const allowed=await database.call('rate',{key:`recovery:${tokenHash(input.data.email)}`,seconds:300});
 if(allowed)await database.call('queue_recovery',{email:input.data.email,environment:commerceEnvironment()});
 return Response.json({message:'If this email has a purchased reading, a verification link will be sent.'},{headers:privateHeaders});
}catch(error){return failure(error);}}
