import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./report-pdf',()=>({generateReportPdf:vi.fn(()=>new TextEncoder().encode('%PDF-1.4\nroute-test-double'))}));
vi.mock('./server/access',()=>({authorizedOrder:vi.fn()}));
import { authorizedOrder } from './server/access';
import { generateReportPdf } from './report-pdf';
import FullReport from '../app/report/[date]/page';
import { GET } from '../app/report/[date]/pdf/route';
const id='9086a0d3-4ed2-4dd2-a651-476bcbcf61d8';
const order={id,customerId:id,email:'reader@example.com',birthDate:'1993-04-17',productId:'destiny-code-complete-reading',amount:1290,currency:'USD',environment:'live' as const,status:'paid' as const,provider:'test',checkoutId:'checkout',paymentId:'payment'};
const request=(query='')=>new Request(`http://localhost:3000/report/${id}/pdf${query}`);
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
describe('premium routes require server authorization before generation',()=>{
 it.each(['production','development','test'])('denies unauthenticated %s, including legacy preview flags',async mode=>{
  vi.stubEnv('NODE_ENV',mode);vi.stubEnv('DESTINY_CODE_LOCAL_PREVIEW','1');vi.stubEnv('DESTINY_CODE_DEV_CHECKOUT','1');vi.mocked(authorizedOrder).mockResolvedValue(null);
  expect((await GET(request('?paid=true&preview=1'),{params:Promise.resolve({date:id})})).status).toBe(404);
  expect(generateReportPdf).not.toHaveBeenCalled();
  await expect(FullReport({params:Promise.resolve({date:id})})).rejects.toMatchObject({digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
 });
 it.each(['light','dark'])('uses authorized stored date for %s PDF, with no caching',async edition=>{
  vi.mocked(authorizedOrder).mockResolvedValue(order);
  const response=await GET(request('?edition='+edition),{params:Promise.resolve({date:id})});
  expect(authorizedOrder).toHaveBeenCalledWith(id);expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(response.headers.get('Content-Disposition')).toContain(`1993-04-17-${edition}.pdf`);
  expect(generateReportPdf).toHaveBeenCalledWith(expect.objectContaining({date:'1993-04-17'}),edition);
 });
 it.each(['?edition=paid','?edition=light&edition=dark'])('rejects invalid presentation selection %s',async query=>{
  vi.mocked(authorizedOrder).mockResolvedValue(order);expect((await GET(request(query),{params:Promise.resolve({date:id})})).status).toBe(400);expect(generateReportPdf).not.toHaveBeenCalled();
 });
 it('validates stored calendar dates as well as checkout input',async()=>{
  vi.mocked(authorizedOrder).mockResolvedValue({...order,birthDate:'2024-02-30'});expect((await GET(request(),{params:Promise.resolve({date:id})})).status).toBe(400);expect(generateReportPdf).not.toHaveBeenCalled();
 });
});
