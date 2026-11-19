import 'server-only';
import { cookies } from 'next/headers';
import { cookieName, commerceEnvironment } from './config';
import { store } from './store';
import { orderSchema } from './contracts';
import { validToken, tokenHash } from './tokens';
export async function checkoutStatus(){
 const token=(await cookies()).get(cookieName('checkout'))?.value;if(!validToken(token))return null;
 const parsed=orderSchema.safeParse(await store().call('checkout_order',{hash:tokenHash(token),environment:commerceEnvironment()}));return parsed.success?parsed.data:null;
}
