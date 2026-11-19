import 'server-only';
import { z } from 'zod';
export const paymentState=z.enum(['pending','paid','failed','refunded','reversed','disputed']);
export const environment=z.enum(['live','development']);
export const orderSchema=z.object({id:z.uuid(),customerId:z.uuid(),email:z.email(),birthDate:z.string(),productId:z.string(),amount:z.number().int(),currency:z.string(),environment,status:paymentState,provider:z.string().nullable(),checkoutId:z.string().nullable(),paymentId:z.string().nullable()});
export type Order=z.infer<typeof orderSchema>;
export const paymentSchema=z.object({orderId:z.uuid(),checkoutId:z.string().min(1).max(255),paymentId:z.string().min(1).max(255),productId:z.string().min(1),amount:z.number().int(),currency:z.string(),environment,state:paymentState});
export type Payment=z.infer<typeof paymentSchema>;
export const eventSchema=paymentSchema.extend({eventId:z.string().min(1).max(255)});
export type PaymentEvent=z.infer<typeof eventSchema>;
/** An adapter must implement the selected provider's documented verification, not a generic invented signature. */
export interface PaymentProvider {
 readonly id:string;
 createCheckoutSession(input:{orderId:string;productId:string;name:string;amount:number;currency:'USD';email:string;idempotencyKey:string;successUrl:string;cancelUrl:string}):Promise<{id:string;url:string}>;
 verifyWebhook(input:{rawBody:Uint8Array;headers:Headers}):Promise<unknown>;
 normalizePaymentEvent(verified:unknown):Promise<PaymentEvent>;
 retrievePaymentStatus(paymentId:string):Promise<Payment>;
}
export interface TransactionalEmail {
 sendAccessLink(input:{email:string;url:string;idempotencyKey:string}):Promise<void>;
}
export type Operation='create'|'bind'|'event'|'checkout_token'|'checkout_order'|'link'|'redeem'|'authorize'|'list'|'queue_recovery'|'claim_mail'|'ack_mail'|'release_mail'|'rate';
export interface Store {call(operation:Operation,input:Record<string,unknown>):Promise<unknown>}
export class ServiceError extends Error {constructor(public status:number,message:string){super(message);}}
