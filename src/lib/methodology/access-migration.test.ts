import { afterEach,describe,expect,it,vi } from 'vitest';
vi.mock('../server/access',()=>({authorizedOrder:vi.fn()}));
vi.mock('../report-pdf',()=>({generateReportPdf:vi.fn(()=>new TextEncoder().encode('%PDF-legacy-test-double'))}));
vi.mock('./pdf',()=>({generateCandidatePdf:vi.fn(()=>new TextEncoder().encode('%PDF-candidate-test-double'))}));
import { authorizedOrder } from '../server/access';
import { generateReportPdf } from '../report-pdf';
import { generateCandidatePdf } from './pdf';
import { activeReadingRelease } from './release';
import { registerLocalReportEdition,readingForAuthorizedOrder,reportEditionForOrder,readingCacheKey } from '../server/report-editions';
import { GET as paidPdf } from '@/app/report/[date]/pdf/route';
import { GET as samplePdf } from '@/app/report/demo/pdf/route';
import FullReport from '@/app/report/[date]/page';
import FreeResult from '@/app/result/page';
import Sample from '@/app/report/demo/page';
import type { Order } from '../server/contracts';
const order:Order={id:'fd34e9e2-b36b-44d7-b092-aa503f2ad82f',customerId:'ec1d7c4a-6812-4531-a636-37221c539361',email:'reader@example.com',birthDate:'1991-12-09',productId:'destiny-code-complete-reading',amount:1290,currency:'USD',environment:'live',status:'paid',provider:'test',checkoutId:'checkout',paymentId:'payment'};
const params=()=>({params:Promise.resolve({date:order.id})});
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('release selection and historical purchases',()=>{
 it('uses the customer public edition on deployments and limits historical UI rollback to local development',()=>{
  expect(activeReadingRelease({NODE_ENV:'development'})).toBe('research-c');expect(activeReadingRelease({NODE_ENV:'development',DESTINY_CODE_READING_RELEASE:'legacy-v4'})).toBe('legacy-v4');expect(activeReadingRelease({NODE_ENV:'production',DESTINY_CODE_READING_RELEASE:'research-c'})).toBe('research-c');expect(activeReadingRelease({NODE_ENV:'production',DESTINY_CODE_READING_RELEASE:'legacy-v4'})).toBe('research-c');
 });
 it('keeps every unversioned historical order on its earlier engine without another payment',()=>{
  expect(reportEditionForOrder(order)).toBe('legacy-v4');const result=readingForAuthorizedOrder(order);expect(result.edition).toBe('legacy-v4');if(result.edition==='legacy-v4'){expect(result.report.version).toBe('4.0');expect(result.report.matrix.E).toBe(10);}expect(readingCacheKey(order)).toContain(order.id);
 });
 it('pins only newly created local simulator orders; rollback does not rewrite that pinned order',()=>{
  vi.stubEnv('NODE_ENV','development');vi.stubEnv('DESTINY_CODE_DEV_CHECKOUT','1');vi.stubEnv('DESTINY_CODE_READING_RELEASE','research-c');const local={...order,environment:'development' as const};registerLocalReportEdition(local.id);expect(reportEditionForOrder(local)).toBe('research-c');vi.stubEnv('DESTINY_CODE_READING_RELEASE','legacy-v4');expect(reportEditionForOrder(local)).toBe('research-c');const result=readingForAuthorizedOrder(local);expect(result.edition).toBe('research-c');expect(readingCacheKey(local)).toContain('C-family-center-v1');
  vi.stubEnv('NODE_ENV','production');expect(reportEditionForOrder(local)).toBe('legacy-v4');expect(()=>registerLocalReportEdition(local.id)).toThrow();
 });
});
describe('paid authorization and explicit downloads',()=>{
 it('denies full reports and PDFs before composition, regardless of preview/query/version flags',async()=>{
  vi.mocked(authorizedOrder).mockResolvedValue(null);vi.stubEnv('NODE_ENV','development');
  const response=await paidPdf(new Request(`http://localhost:3000/report/${order.id}/pdf?edition=dark&paid=true&method=research-c`),params());expect(response.status).toBe(404);expect(generateCandidatePdf).not.toHaveBeenCalled();expect(generateReportPdf).not.toHaveBeenCalled();await expect(FullReport(params())).rejects.toMatchObject({digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
 });
 it('continues existing-purchaser PDF access through the legacy renderer',async()=>{
  vi.mocked(authorizedOrder).mockResolvedValue(order);const response=await paidPdf(new Request(`http://localhost:3000/report/${order.id}/pdf?edition=light`),params());expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(generateReportPdf).toHaveBeenCalledWith(expect.objectContaining({version:'4.0',date:order.birthDate}),'light');expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
 it.each(['light','dark'])('uses the pinned candidate with the same authorized order for %s PDF',async edition=>{
  vi.stubEnv('NODE_ENV','development');vi.stubEnv('DESTINY_CODE_DEV_CHECKOUT','1');vi.stubEnv('DESTINY_CODE_READING_RELEASE','research-c');const local={...order,environment:'development' as const};registerLocalReportEdition(local.id);vi.mocked(authorizedOrder).mockResolvedValue(local);const response=await paidPdf(new Request(`http://localhost:3000/report/${order.id}/pdf?edition=${edition}`),params());expect(response.status).toBe(200);expect(generateCandidatePdf).toHaveBeenCalledWith(expect.objectContaining({dateOnly:order.birthDate,calculationProfile:'C-family-center-v1'}),edition);expect(generateReportPdf).not.toHaveBeenCalled();
 });
});
describe('fixed public sample and free serialization',()=>{
 it.each(['light','dark'])('allows only the fixed sample for %s, never a user date',async edition=>{
  const response=await samplePdf(new Request(`http://localhost:3000/report/demo/pdf?edition=${edition}`));expect(response.status).toBe(200);expect(generateCandidatePdf).toHaveBeenCalledWith(expect.objectContaining({dateOnly:'1991-12-09'}),edition,true);
  vi.clearAllMocks();expect((await samplePdf(new Request(`http://localhost:3000/report/demo/pdf?edition=${edition}&date=1987-01-23`))).status).toBe(400);expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
 it('publishes only the fixed customer sample in production, without granting private access',async()=>{vi.stubEnv('NODE_ENV','production');vi.stubEnv('DESTINY_CODE_READING_RELEASE','legacy-v4');expect((await samplePdf(new Request('https://example.com/report/demo/pdf?edition=dark'))).status).toBe(200);expect(generateCandidatePdf).toHaveBeenCalledWith(expect.objectContaining({dateOnly:'1991-12-09'}),'dark',true);});
 it('serializes no paid AST or premium data in free result component props',async()=>{
  const result=await FreeResult({searchParams:Promise.resolve({date:'1991-12-09'})}),serialized=JSON.stringify(result,(key,value)=>key==='type'?undefined:value);expect(serialized).not.toMatch(/sourceDataHash|semanticContentHash|domainReadings|reflectivePractice|shadowManifestations|provenance|formulaIds|orderedValues|patternData/);expect(serialized).toContain('depth and independent understanding');
 });
 it('ignores visitor parameters for the public full sample',()=>{
  const result=Reflect.apply(Sample,undefined,[{searchParams:Promise.resolve({date:'1987-01-23',isSample:'true'})}]),serialized=JSON.stringify(result);expect(serialized).toContain('1991-12-09');expect(serialized).not.toContain('1987-01-23');
 });
});
