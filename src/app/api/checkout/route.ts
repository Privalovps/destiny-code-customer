import { cookies } from 'next/headers';
import { appOrigin, checkoutOperational, cookieName, cookieOptions } from '@/lib/server/config';
import { ServiceError } from '@/lib/server/contracts';
import { failure, jsonBody, privateHeaders, sameOrigin } from '@/lib/server/http';
import { checkoutInput, createPendingOrder } from '@/lib/server/payments';
import { PRODUCT } from '@/lib/server/product';
import { paymentProvider } from '@/lib/server/providers';
import { store } from '@/lib/server/store';
import { CHECKOUT_SECONDS, randomToken, tokenHash } from '@/lib/server/tokens';
export const runtime='nodejs';
export async function POST(request:Request){try{
 sameOrigin(request);if(!checkoutOperational())throw new ServiceError(503,'Purchasing is not available yet. No payment has been collected.');
 const database=store();const parsed=checkoutInput().safeParse(await jsonBody(request));if(!parsed.success)throw new ServiceError(400,'Enter a valid email and birth date.');const input=parsed.data;
 if(!await database.call('rate',{key:`checkout:${tokenHash(input.email)}`,seconds:60}))throw new ServiceError(429,'Please wait before creating another checkout.');
 const order=await createPendingOrder(database,input);const provider=paymentProvider()!;
 // A durable pending order exists before calling the provider. Never accept a client price.
 const session=await provider.createCheckoutSession({orderId:order.id,productId:PRODUCT.id,name:PRODUCT.name,amount:PRODUCT.amount,currency:PRODUCT.currency,email:order.email,idempotencyKey:order.id,successUrl:`${appOrigin()}/checkout/pending`,cancelUrl:`${appOrigin()}/checkout/failure`});
 const target=new URL(session.url);if(target.protocol!=='https:'||target.username||target.password)throw new ServiceError(503,'Checkout returned an invalid destination.');
 await database.call('bind',{orderId:order.id,provider:provider.id,checkoutId:session.id});
 const token=randomToken();await database.call('checkout_token',{orderId:order.id,hash:tokenHash(token),seconds:CHECKOUT_SECONDS});
 (await cookies()).set(cookieName('checkout'),token,{...cookieOptions(),maxAge:CHECKOUT_SECONDS});
 return Response.json({url:target.href},{headers:privateHeaders});
}catch(error){return failure(error);}}
