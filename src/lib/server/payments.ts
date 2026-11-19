import 'server-only';
import { z } from 'zod';
import { dateSchema } from '@/lib/numerology';
import { PRODUCT } from './product';
import { eventSchema, orderSchema, paymentSchema, ServiceError, type PaymentProvider, type Store } from './contracts';
import { tokenHash } from './tokens';
export function checkoutInput(){return z.object({email:z.email().max(254).transform(v=>v.trim().toLowerCase()),birthDate:dateSchema()}).strict();}
export async function createPendingOrder(database:Store,input:unknown){
 const parsed=checkoutInput().safeParse(input);if(!parsed.success)throw new ServiceError(400,'Enter a valid email and birth date.');
 return orderSchema.parse(await database.call('create',parsed.data));
}
export async function processWebhook(provider:PaymentProvider,database:Store,rawBody:Uint8Array,headers:Headers){
 const verified=await provider.verifyWebhook({rawBody,headers});
 const event=eventSchema.parse(await provider.normalizePaymentEvent(verified));
 const current=paymentSchema.parse(await provider.retrievePaymentStatus(event.paymentId));
 // The authenticated provider API is authoritative for delayed/out-of-order notifications.
 for(const key of ['orderId','checkoutId','paymentId','productId','amount','currency','environment'] as const)if(current[key]!==event[key])throw new ServiceError(400,'Payment identity does not match.');
 if(current.productId!==PRODUCT.id||current.amount!==PRODUCT.amount||current.currency!==PRODUCT.currency||current.environment!=='live')throw new ServiceError(400,'Payment product, amount or environment does not match.');
 const digest=tokenHash(JSON.stringify(event));
 return database.call('event',{...current,eventId:event.eventId,digest,provider:provider.id});
}
