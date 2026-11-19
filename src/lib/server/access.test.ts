import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/headers',()=>({cookies:vi.fn()}));
vi.mock('./store',()=>({store:vi.fn()}));
import { cookies } from 'next/headers';
import { store } from './store';
import { authorizedOrder } from './access';
import { PRODUCT } from './product';
import { randomToken } from './tokens';
const call=vi.fn();
const id='9086a0d3-4ed2-4dd2-a651-476bcbcf61d8';
const order={id,customerId:id,email:'reader@example.com',birthDate:'1993-04-17',productId:PRODUCT.id,amount:1290,currency:'USD',environment:'live',status:'paid',provider:'p',checkoutId:'c',paymentId:'p'};
beforeEach(()=>{
 vi.stubEnv('NODE_ENV','production');vi.stubEnv('DESTINY_CODE_DEV_CHECKOUT','1');
 vi.mocked(store).mockReturnValue({call});
 vi.mocked(cookies).mockResolvedValue({get:()=>({value:randomToken()})} as unknown as Awaited<ReturnType<typeof cookies>>);
});
afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs();});
describe('request-level entitlement boundary',()=>{
 it('denies date URLs before reading cookies or storage',async()=>{expect(await authorizedOrder('1993-04-17')).toBeNull();expect(cookies).not.toHaveBeenCalled();expect(call).not.toHaveBeenCalled();});
 it('denies IDs without a valid session token',async()=>{vi.mocked(cookies).mockResolvedValue({get:()=>undefined} as unknown as Awaited<ReturnType<typeof cookies>>);expect(await authorizedOrder(id)).toBeNull();expect(call).not.toHaveBeenCalled();});
 it('requires storage authorization and passes the live environment even with dev flag',async()=>{call.mockResolvedValue(null);expect(await authorizedOrder(id)).toBeNull();expect(call).toHaveBeenCalledWith('authorize',expect.objectContaining({orderId:id,environment:'live',hash:expect.stringMatching(/^[a-f0-9]{64}$/)}));});
 it('allows the confirmed canonical product',async()=>{call.mockResolvedValue(order);expect(await authorizedOrder(id)).toEqual(order);});
 it.each([{id:'65db5848-59bc-4212-bd78-0276a1775ae4'},{status:'pending'},{status:'refunded'},{amount:1},{currency:'EUR'},{productId:'other'},{environment:'development'}])('fails closed for inconsistent order %j',async change=>{call.mockResolvedValue({...order,...change});expect(await authorizedOrder(id)).toBeNull();});
});
