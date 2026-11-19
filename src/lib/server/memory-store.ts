import 'server-only';
import { randomUUID } from 'node:crypto';
import { PRODUCT } from './product';
import { ServiceError, type Order, type Store, type Operation } from './contracts';
/** Volatile, bounded local simulator. Never used as a production database fallback. */
export class MemoryStore implements Store {
 private orders=new Map<string,Order>();
 private credentials=new Map<string,{customerId:string;orderId?:string;expires:number;kind:string}>();
 private events=new Map<string,string>();
 async call(operation:Operation,input:Record<string,unknown>):Promise<unknown>{
  const now=Date.now();
  for(const [key,value] of this.credentials) if(value.expires<=now) this.credentials.delete(key);
  if(operation==='create'){
   if(this.orders.size>=200) throw new ServiceError(429,'Restart the local simulator to clear test orders.');
   const email=String(input.email);const existing=[...this.orders.values()].find(o=>o.email===email);
   const order:Order={id:randomUUID(),customerId:existing?.customerId??randomUUID(),email,birthDate:String(input.birthDate),productId:PRODUCT.id,amount:PRODUCT.amount,currency:PRODUCT.currency,environment:'development',status:'pending',provider:null,checkoutId:null,paymentId:null};
   this.orders.set(order.id,order);return {...order};
  }
  const order=this.orders.get(String(input.orderId));
  if(operation==='bind'&&order){order.provider=String(input.provider);order.checkoutId=String(input.checkoutId);return null;}
  if(operation==='event'&&order){
   if(input.productId!==PRODUCT.id||input.amount!==PRODUCT.amount||input.currency!==PRODUCT.currency||input.environment!=='development'||order.provider!==input.provider||order.checkoutId!==input.checkoutId||(order.paymentId&&order.paymentId!==input.paymentId)) throw new ServiceError(400,'Payment does not match the order.');
   const key=`${input.provider}:${input.eventId}`;const digest=String(input.digest);
   if(this.events.has(key)){if(this.events.get(key)!==digest)throw new ServiceError(400,'Conflicting payment event.');return {...order};}
   if(this.events.size>=1000)throw new ServiceError(429,'Local event limit reached.');
   this.events.set(key,digest);order.paymentId=String(input.paymentId);
   if(!['refunded','reversed','disputed'].includes(order.status)&&!(order.status==='paid'&&['pending','failed'].includes(String(input.state)))) order.status=input.state as Order['status'];
   return {...order};
  }
  if(operation==='checkout_token'&&order){this.put(input,'checkout',order.customerId,order.id);return null;}
  if(operation==='link'){if(![...this.orders.values()].some(o=>o.customerId===input.customerId&&o.status==='paid'))throw new ServiceError(403,'No active test entitlement.');this.put(input,'link',String(input.customerId));return null;}
  if(operation==='redeem'){
   const link=this.credentials.get(String(input.hash));if(!link||link.kind!=='link')return null;
   this.credentials.delete(String(input.hash));this.put({...input,hash:input.sessionHash,seconds:input.sessionSeconds},'access',link.customerId);return {customerId:link.customerId};
  }
  const credential=this.credentials.get(String(input.hash));
  if(operation==='checkout_order')return credential?.kind==='checkout'?this.orders.get(credential.orderId??'')??null:null;
  if(operation==='authorize')return credential?.kind==='access'&&order?.customerId===credential.customerId&&order.status==='paid'?{...order}:null;
  if(operation==='list')return credential?.kind==='access'?[...this.orders.values()].filter(o=>o.customerId===credential.customerId&&o.status==='paid'):[];
  if(operation==='rate')return true;
  if(operation==='queue_recovery')return null;
  if(operation==='claim_mail')return null;
  throw new ServiceError(400,'Invalid local operation.');
 }
 private put(input:Record<string,unknown>,kind:string,customerId:string,orderId?:string){
  if(this.credentials.size>=1000)throw new ServiceError(429,'Local credential limit reached.');
  this.credentials.set(String(input.hash),{kind,customerId,orderId,expires:Date.now()+Number(input.seconds)*1000});
 }
}
