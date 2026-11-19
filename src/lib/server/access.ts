import 'server-only';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { cookieName, commerceEnvironment } from './config';
import { orderSchema } from './contracts';
import { PRODUCT } from './product';
import { store } from './store';
import { tokenHash, validToken } from './tokens';
export async function authorizedOrder(id:string){
 if(!z.uuid().safeParse(id).success)return null;
 const token=(await cookies()).get(cookieName('access'))?.value;if(!validToken(token))return null;
 const value=await store().call('authorize',{orderId:id,hash:tokenHash(token!),environment:commerceEnvironment()});
 const parsed=orderSchema.safeParse(value);if(!parsed.success)return null;const order=parsed.data;
 return order.id===id&&order.status==='paid'&&order.productId===PRODUCT.id&&order.amount===PRODUCT.amount&&order.currency===PRODUCT.currency&&order.environment===commerceEnvironment()?order:null;
}
export async function purchasedReadings(){
 const token=(await cookies()).get(cookieName('access'))?.value;if(!validToken(token))return [];
 return z.array(orderSchema).parse(await store().call('list',{hash:tokenHash(token!),environment:commerceEnvironment()}));
}
