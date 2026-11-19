import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryStore } from './memory-store';
import { PRODUCT, PRODUCT_PRICE } from './product';
import { createPendingOrder, processWebhook } from './payments';
import { developmentCheckoutEnabled, checkoutOperational } from './config';
import { type PaymentProvider, type Store, orderSchema } from './contracts';
import { randomToken, tokenHash, validToken } from './tokens';
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();});
describe('single product and provider boundaries',()=>{
 it('has one permanent price and rejects price overrides',async()=>{
  expect(PRODUCT.amount).toBe(1290);expect(PRODUCT.currency).toBe('USD');expect(PRODUCT_PRICE).toBe('$12.90');
  await expect(createPendingOrder(new MemoryStore(),{email:'a@example.com',birthDate:'1993-04-17',amount:1})).rejects.toThrow();
 });
 it.each(['production','test',undefined])('cannot enable development checkout in %s',NODE_ENV=>{expect(developmentCheckoutEnabled({NODE_ENV,DESTINY_CODE_DEV_CHECKOUT:'1'})).toBe(false);});
 it('never declares live checkout ready without actual adapters',()=>{vi.stubEnv('ENABLE_LIVE_CHECKOUT','1');expect(checkoutOperational()).toBe(false);});
 it('rejects unsigned or mismatched events before fulfillment',async()=>{
  const database:Store={call:vi.fn()};const payment={orderId:'9086a0d3-4ed2-4dd2-a651-476bcbcf61d8',checkoutId:'c',paymentId:'p',productId:PRODUCT.id,amount:1290,currency:'USD',environment:'live' as const,state:'paid' as const};
  const provider:PaymentProvider={id:'test-only',createCheckoutSession:vi.fn(),verifyWebhook:vi.fn().mockRejectedValue(new Error('Invalid signature')),normalizePaymentEvent:vi.fn().mockResolvedValue({...payment,eventId:'e'}),retrievePaymentStatus:vi.fn().mockResolvedValue(payment)};
  await expect(processWebhook(provider,database,new Uint8Array(),new Headers())).rejects.toThrow('Invalid signature');expect(database.call).not.toHaveBeenCalled();
  vi.mocked(provider.verifyWebhook).mockResolvedValue({});vi.mocked(provider.retrievePaymentStatus).mockResolvedValue({...payment,amount:1291});
  await expect(processWebhook(provider,database,new Uint8Array(),new Headers())).rejects.toThrow();expect(database.call).not.toHaveBeenCalled();
  vi.mocked(provider.retrievePaymentStatus).mockResolvedValue(payment);await processWebhook(provider,database,new Uint8Array(),new Headers());expect(database.call).toHaveBeenCalledWith('event',expect.objectContaining({amount:1290,currency:'USD',provider:'test-only'}));
 });
});
describe('bounded local entitlement flow',()=>{
 it('denies pending access, grants once, exchanges one-use links, checks ownership and revokes immediately',async()=>{
  const database=new MemoryStore();const order=await createPendingOrder(database,{email:'reader@example.com',birthDate:'1993-04-17'});
  await database.call('bind',{orderId:order.id,provider:'local-simulator',checkoutId:order.id});
  const link=randomToken(),session=randomToken();expect(validToken(link)).toBe(true);expect(tokenHash(link)).not.toContain(link);
  const access={orderId:order.id,hash:tokenHash(session)};expect(await database.call('authorize',access)).toBeNull();
  await expect(database.call('link',{customerId:order.customerId,hash:tokenHash(link),seconds:900})).rejects.toThrow();
  const event={orderId:order.id,provider:'local-simulator',checkoutId:order.id,paymentId:order.id,eventId:'paid',digest:'digest',productId:PRODUCT.id,amount:1290,currency:'USD',environment:'development',state:'paid'};
  await expect(database.call('event',{...event,amount:1})).rejects.toThrow();
  await database.call('event',event);await database.call('event',event);
  await database.call('link',{customerId:order.customerId,hash:tokenHash(link),seconds:900});
  expect(await database.call('redeem',{hash:tokenHash(link),sessionHash:tokenHash(session),sessionSeconds:3600})).toBeTruthy();
  expect(await database.call('redeem',{hash:tokenHash(link),sessionHash:'other',sessionSeconds:3600})).toBeNull();
  expect(orderSchema.parse(await database.call('authorize',access)).status).toBe('paid');
  await expect(database.call('event',{...event,digest:'changed'})).rejects.toThrow();
  const other=await createPendingOrder(database,{email:'other@example.com',birthDate:'1994-05-18'});expect(await database.call('authorize',{...access,orderId:other.id})).toBeNull();
  await database.call('event',{...event,eventId:'refund',state:'refunded'});expect(await database.call('authorize',access)).toBeNull();
  await database.call('event',{...event,eventId:'late-success'});expect(await database.call('authorize',access)).toBeNull();
 });
 it('expires verification links and access sessions',async()=>{
  vi.useFakeTimers();const database=new MemoryStore();const order=await createPendingOrder(database,{email:'reader@example.com',birthDate:'1993-04-17'});
  await database.call('bind',{orderId:order.id,provider:'local-simulator',checkoutId:order.id});
  await database.call('event',{orderId:order.id,provider:'local-simulator',checkoutId:order.id,paymentId:order.id,eventId:'paid',digest:'digest',productId:PRODUCT.id,amount:1290,currency:'USD',environment:'development',state:'paid'});
  await database.call('link',{customerId:order.customerId,hash:'expired',seconds:1});vi.advanceTimersByTime(1001);
  expect(await database.call('redeem',{hash:'expired',sessionHash:'session',sessionSeconds:1})).toBeNull();
  await database.call('link',{customerId:order.customerId,hash:'valid',seconds:900});await database.call('redeem',{hash:'valid',sessionHash:'session',sessionSeconds:1});vi.advanceTimersByTime(1001);
  expect(await database.call('list',{hash:'session'})).toEqual([]);
 });
});
