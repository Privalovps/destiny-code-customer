import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/headers',()=>({cookies:vi.fn(),headers:vi.fn()}));
vi.mock('./store',()=>({store:vi.fn()}));
vi.mock('../methodology/pdf',()=>({generateCandidatePdf:vi.fn(()=>new TextEncoder().encode('%PDF-fixed-sample-test-double'))}));
vi.mock('../report-pdf',()=>({generateReportPdf:vi.fn(()=>new TextEncoder().encode('%PDF-authorized-test-double'))}));
import { cookies,headers } from 'next/headers';
import { store } from './store';
import { randomToken } from './tokens';
import { PRODUCT,PRODUCT_PRICE } from './product';
import { checkoutOperational,developmentCheckoutEnabled } from './config';
import { activeReadingRelease } from '../methodology/release';
import { localDevelopmentEnvironment } from './development-environment';
import { publicSiteOrigin } from './site-origin';
import { MAX_PDF_BYTES,privatePdfResponse } from './pdf-response';
import Free from '@/app/result/page';
import Sample from '@/app/report/demo/page';
import Paid from '@/app/report/[date]/page';
import { GET as paidPdf } from '@/app/report/[date]/pdf/route';
import { GET as samplePdf } from '@/app/report/demo/pdf/route';
import DevHome from '@/app/dev/report-preview/page';
import DevReading from '@/app/dev/report-preview/reading/page';
import { GET as devPdf } from '@/app/dev/report-preview/pdf/route';
import DevCheckout from '@/app/dev/checkout/page';
import { POST as devCheckout } from '@/app/api/dev/checkout/route';
import { POST as checkout } from '@/app/api/checkout/route';
import { POST as webhook } from '@/app/api/payments/webhook/route';
import { POST as delivery } from '@/app/api/internal/deliver/route';
import { generateCandidatePdf } from '../methodology/pdf';
const origin='https://destiny.example',id='9086a0d3-4ed2-4dd2-a651-476bcbcf61d8';
const call=vi.fn();
const order={id,customerId:id,email:'reader@example.com',birthDate:'2005-08-29',productId:PRODUCT.id,amount:1290,currency:'USD',environment:'live',status:'paid',provider:'verified-test-provider',checkoutId:'c',paymentId:'p'};
const params=(date=id)=>({params:Promise.resolve({date})});
beforeEach(()=>{
 vi.stubEnv('NODE_ENV','production');vi.stubEnv('VERCEL','1');vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('APP_ORIGIN',origin);vi.stubEnv('DESTINY_CODE_LOCAL_REPORT_PREVIEW','1');vi.stubEnv('DESTINY_CODE_DEV_CHECKOUT','1');vi.stubEnv('DESTINY_CODE_READING_RELEASE','legacy-v4');vi.stubEnv('ENABLE_LIVE_CHECKOUT','1');
 vi.mocked(store).mockReturnValue({call});vi.mocked(headers).mockResolvedValue(new Headers({host:'127.0.0.1:3000'}));vi.mocked(cookies).mockResolvedValue({get:()=>undefined} as unknown as Awaited<ReturnType<typeof cookies>>);vi.clearAllMocks();
});
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
describe('customer public boundaries on a deployed runtime',()=>{
 it('keeps the 38-value public edition and 1991 sample regardless of legacy UI flags',()=>{
  expect(activeReadingRelease()).toBe('research-c');expect(activeReadingRelease({NODE_ENV:'development',VERCEL:'1',DESTINY_CODE_READING_RELEASE:'legacy-v4'})).toBe('research-c');
  const html=renderToStaticMarkup(Sample());expect(html).toContain('1991-12-09');expect(html).toContain('FIXED PUBLIC SAMPLE');expect(html).toContain('CHAPTER 10');expect(store).not.toHaveBeenCalled();
 });
 it.each(['1991-12-09','2005-08-29'])('allows only free output for an arbitrary birth date %s',async date=>{
  const element=await Free({searchParams:Promise.resolve({date})});const payload=JSON.stringify(element,(key,value)=>key==='type'?undefined:value);expect(payload).toContain(date);expect(payload).not.toMatch(/semanticContentHash|shadowManifestations|sourceDataHash|formulaIds|orderedValues/);expect(store).not.toHaveBeenCalled();
 });
 it.each(['light','dark'])('publishes only the fixed demonstration %s PDF',async edition=>{
  expect((await samplePdf(new Request(`${origin}/report/demo/pdf?edition=${edition}`))).status).toBe(200);expect(generateCandidatePdf).toHaveBeenCalledWith(expect.objectContaining({dateOnly:'1991-12-09'}),edition,true);vi.clearAllMocks();expect((await samplePdf(new Request(`${origin}/report/demo/pdf?edition=${edition}&date=2005-08-29`))).status).toBe(400);expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
});
describe('personalized content requires a current server entitlement',()=>{
 it.each(['2005-08-29',id])('denies an unpaid full report at %s',async value=>{await expect(Paid(params(value))).rejects.toThrow();});
 it.each(['light','dark'])('denies an unpaid arbitrary-date or opaque-ID %s PDF',async edition=>{
  for(const value of ['2005-08-29',id]){const result=await paidPdf(new Request(`${origin}/report/${value}/pdf?edition=${edition}&paid=1`),params(value));expect(result.status).toBe(404);expect(result.headers.get('Cache-Control')).toContain('no-store');}expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
 it('continues to grant an existing verified purchaser their preserved edition',async()=>{
  vi.mocked(cookies).mockResolvedValue({get:()=>({value:randomToken()})} as unknown as Awaited<ReturnType<typeof cookies>>);call.mockResolvedValue(order);
  const result=await Paid(params());expect(result.props.report.date).toBe(order.birthDate);expect((await paidPdf(new Request(`${origin}/report/${id}/pdf?edition=light`),params())).status).toBe(200);expect(call).toHaveBeenCalledWith('authorize',expect.objectContaining({orderId:id,environment:'live'}));
 });
 it('keeps storage failures private and never returns PDF data on failure',async()=>{
  vi.mocked(cookies).mockResolvedValue({get:()=>({value:randomToken()})} as unknown as Awaited<ReturnType<typeof cookies>>);call.mockRejectedValue(new Error('private storage details'));
  const result=await paidPdf(new Request(`${origin}/report/${id}/pdf?edition=dark`),params());expect(result.status).toBe(503);expect(result.headers.get('Cache-Control')).toContain('no-store');expect(await result.text()).not.toContain('private storage details');
 });
});
describe('no deployed developer or simulated payment bypasses',()=>{
 it.each(['production','development'])('denies every local tool on Vercel even in %s with all flags set',async mode=>{
  vi.stubEnv('NODE_ENV',mode);expect(developmentCheckoutEnabled()).toBe(false);expect(localDevelopmentEnvironment()).toBe(false);
  await expect(DevHome({searchParams:Promise.resolve({date:'2005-08-29'})})).rejects.toThrow();await expect(DevReading({searchParams:Promise.resolve({date:'2005-08-29'})})).rejects.toThrow();await expect(DevCheckout({searchParams:Promise.resolve({date:'2005-08-29'})})).rejects.toThrow();
  expect((await devPdf(new Request('http://127.0.0.1:3000/dev/report-preview/pdf?date=2005-08-29&edition=light',{headers:{host:'127.0.0.1:3000'}}))).status).toBe(404);
  expect((await devCheckout(new Request('http://127.0.0.1:3000/api/dev/checkout',{method:'POST'}))).status).toBe(404);expect(call).not.toHaveBeenCalled();
 });
 it('keeps price fixed and all live payment entry points unavailable without real adapters',async()=>{
  expect(PRODUCT.amount).toBe(1290);expect(PRODUCT_PRICE).toBe('$12.90');expect(checkoutOperational()).toBe(false);
  expect((await checkout(new Request(`${origin}/api/checkout`,{method:'POST',headers:{origin}}))).status).toBe(503);expect((await webhook(new Request(`${origin}/api/payments/webhook`,{method:'POST'}))).status).toBe(503);expect((await delivery(new Request(`${origin}/api/internal/deliver`,{method:'POST'}))).status).toBe(401);expect(call).not.toHaveBeenCalled();
 });
});
describe('deployment metadata and bounded PDF responses',()=>{
 it('derives HTTPS metadata from configured or Vercel origins without production localhost fallback',()=>{
  expect(publicSiteOrigin({NODE_ENV:'production',VERCEL_URL:'project-hash.vercel.app'}).origin).toBe('https://project-hash.vercel.app');expect(publicSiteOrigin({NODE_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://destiny.example'}).origin).toBe(origin);
  for(const url of ['http://localhost:3000','http://example.com','https://example.com/path','https://user:pass@example.com'])expect(()=>publicSiteOrigin({NODE_ENV:'production',NEXT_PUBLIC_SITE_URL:url})).toThrow();expect(()=>publicSiteOrigin({NODE_ENV:'production'})).toThrow();
 });
 it('rejects oversized buffered PDFs and keeps accepted bytes private without writing files',async()=>{
  const ok=privatePdfResponse(new TextEncoder().encode('%PDF-test'),'destiny-code-example.pdf');expect(ok.status).toBe(200);expect(ok.headers.get('Cache-Control')).toContain('no-store');expect(await ok.text()).toBe('%PDF-test');expect(privatePdfResponse(new Uint8Array(MAX_PDF_BYTES+1),'destiny-code-example.pdf').status).toBe(503);
 });
});
