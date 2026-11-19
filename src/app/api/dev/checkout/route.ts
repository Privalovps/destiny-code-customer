import { registerLocalReportEdition } from '@/lib/server/report-editions';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { cookieName, cookieOptions } from '@/lib/server/config';
import { orderSchema, ServiceError } from '@/lib/server/contracts';
import { failure, jsonBody, localOnly, privateHeaders } from '@/lib/server/http';
import { createPendingOrder } from '@/lib/server/payments';
import { PRODUCT } from '@/lib/server/product';
import { store } from '@/lib/server/store';
import { CHECKOUT_SECONDS, LINK_SECONDS, randomToken, tokenHash, validToken } from '@/lib/server/tokens';
export const runtime='nodejs';
export async function POST(request:Request){try{
 localOnly(request);const parsed=z.object({action:z.enum(['create','pay','revoke']),email:z.string().optional(),birthDate:z.string().optional()}).strict().safeParse(await jsonBody(request));if(!parsed.success)throw new ServiceError(400,'Invalid local test request.');const input=parsed.data;const database=store();
 if(input.action==='create'){
  const order=await createPendingOrder(database,{email:input.email,birthDate:input.birthDate});
  registerLocalReportEdition(order.id);
  await database.call('bind',{orderId:order.id,provider:'local-simulator',checkoutId:order.id});
  const token=randomToken();await database.call('checkout_token',{orderId:order.id,hash:tokenHash(token),seconds:CHECKOUT_SECONDS});
  (await cookies()).set(cookieName('checkout'),token,{...cookieOptions(),maxAge:CHECKOUT_SECONDS});
  return Response.json({message:'Pending test order created. Access is still denied.',reportUrl:`/report/${order.id}`},{headers:privateHeaders});
 }
 const token=(await cookies()).get(cookieName('checkout'))?.value;if(!validToken(token))throw new ServiceError(401,'Create a local pending order first.');
 const order=orderSchema.parse(await database.call('checkout_order',{hash:tokenHash(token!),environment:'development'}));
 const state=input.action==='pay'?'paid':'refunded';
 const updated=orderSchema.parse(await database.call('event',{orderId:order.id,provider:'local-simulator',checkoutId:order.id,paymentId:order.id,eventId:randomToken(),digest:randomToken(),productId:PRODUCT.id,amount:PRODUCT.amount,currency:PRODUCT.currency,environment:'development',state}));
 if(state==='refunded')return Response.json({message:'Test entitlement revoked. Report and PDFs must now deny access.',reportUrl:`/report/${order.id}`},{headers:privateHeaders});
 if(updated.status!=='paid')throw new ServiceError(409,'This test order was revoked. Create a new pending test order.');
 const link=randomToken();await database.call('link',{customerId:order.customerId,hash:tokenHash(link),seconds:LINK_SECONDS,environment:'development'});
 return Response.json({message:'Unpaid local simulation only. Open the one-use verification link to establish a session.',verificationUrl:`/access/verify#token=${link}`,reportUrl:`/report/${order.id}`},{headers:privateHeaders});
}catch(error){return failure(error);}}
