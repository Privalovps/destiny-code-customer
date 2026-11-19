import { appOrigin, developmentCheckoutEnabled } from '@/lib/server/config';
import { ServiceError } from '@/lib/server/contracts';
import { failure, privateHeaders } from '@/lib/server/http';
import { emailProvider } from '@/lib/server/providers';
import { store } from '@/lib/server/store';
import { LINK_SECONDS, randomToken, secretMatches, tokenHash } from '@/lib/server/tokens';
import { z } from 'zod';
export const runtime='nodejs';
export async function POST(request:Request){try{
 const secret=process.env.DELIVERY_SECRET;
 if(!secret||secret.length<32||!secretMatches(request.headers.get('authorization')??'',`Bearer ${secret}`))throw new ServiceError(401,'Unauthorized.');
 const sender=emailProvider();if(!sender||developmentCheckoutEnabled())throw new ServiceError(503,'Email delivery is not configured.');
 const database=store();const claimed=await database.call('claim_mail',{});if(!claimed)return Response.json({processed:0},{headers:privateHeaders});
 const job=z.object({id:z.string(),customerId:z.uuid(),email:z.email(),lease:z.uuid()}).parse(claimed);
 try{
  const token=randomToken();await database.call('link',{customerId:job.customerId,hash:tokenHash(token),seconds:LINK_SECONDS,environment:'live'});
  await sender.sendAccessLink({email:job.email,url:`${appOrigin()}/access/verify#token=${token}`,idempotencyKey:job.id+':'+job.lease});
  await database.call('ack_mail',{id:job.id,lease:job.lease});
 }catch{await database.call('release_mail',{id:job.id,lease:job.lease});throw new ServiceError(503,'Email delivery will need a retry.');}
 return Response.json({processed:1},{headers:privateHeaders});
}catch(error){return failure(error);}}
