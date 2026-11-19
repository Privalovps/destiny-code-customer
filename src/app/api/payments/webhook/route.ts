import { boundedBody, failure, privateHeaders } from '@/lib/server/http';
import { ServiceError } from '@/lib/server/contracts';
import { processWebhook } from '@/lib/server/payments';
import { paymentProvider } from '@/lib/server/providers';
import { store } from '@/lib/server/store';
import { developmentCheckoutEnabled } from '@/lib/server/config';
export const runtime='nodejs';
export async function POST(request:Request){try{
 const provider=paymentProvider();if(!provider||developmentCheckoutEnabled())throw new ServiceError(503,'Payment verification is not configured.');
 await processWebhook(provider,store(),await boundedBody(request,65536),request.headers);
 return Response.json({received:true},{headers:privateHeaders});
}catch(error){return failure(error);}}
