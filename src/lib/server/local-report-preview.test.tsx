import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/headers',()=>({headers:vi.fn()}));
vi.mock('../methodology/report',async original=>{const actual=await original<typeof import('../methodology/report')>();return {...actual,composeCandidate:vi.fn(actual.composeCandidate)};});
vi.mock('../methodology/pdf',()=>({generateCandidatePdf:vi.fn(()=>new TextEncoder().encode('%PDF-local-preview-test-double'))}));
vi.mock('./access',()=>({authorizedOrder:vi.fn(async()=>null)}));
vi.mock('./store',()=>({store:vi.fn(()=>{throw new Error('Local report preview must not access order storage.');})}));
import { headers } from 'next/headers';
import { composeCandidate,FINAL_CONTENT_VERSION } from '../methodology/report';
import { generateCandidatePdf } from '../methodology/pdf';
import { store } from './store';
import PaidReport from '@/app/report/[date]/page';
import { GET as paidPdf } from '@/app/report/[date]/pdf/route';
import { localReportPreviewEnabled,localReportPreviewAllowed,composeLocalPreview,previewDate,localPreviewUrls } from './local-report-preview';
import PreviewPage from '@/app/dev/report-preview/page';
import ReadingPage from '@/app/dev/report-preview/reading/page';
import { GET as pdf } from '@/app/dev/report-preview/pdf/route';
import { CandidateReading } from '@/components/candidate-reading';
const origin='http://127.0.0.1:3000';
const env={NODE_ENV:'development',DESTINY_CODE_LOCAL_REPORT_PREVIEW:'1',APP_ORIGIN:origin};
const request=(query='date=1991-12-09&edition=light',overrides:Record<string,string>={})=>new Request(`${origin}/dev/report-preview/pdf?${query}`,{headers:{host:'127.0.0.1:3000',...overrides}});
const props=(query:Record<string,string|string[]|undefined>={})=>({searchParams:Promise.resolve(query)});
beforeEach(()=>{
 vi.stubEnv('NODE_ENV','development');vi.stubEnv('DESTINY_CODE_LOCAL_REPORT_PREVIEW','1');vi.stubEnv('APP_ORIGIN',origin);
 for(const key of ['VERCEL','VERCEL_ENV','NETLIFY','CONTEXT','CF_PAGES','RENDER','RENDER_EXTERNAL_URL','RAILWAY_ENVIRONMENT','RAILWAY_ENVIRONMENT_ID','FLY_APP_NAME','AWS_LAMBDA_FUNCTION_NAME','K_SERVICE','CI'])vi.stubEnv(key,'');
 vi.mocked(headers).mockResolvedValue(new Headers({host:'127.0.0.1:3000'}));vi.clearAllMocks();
});
afterEach(()=>{vi.unstubAllEnvs();});
describe('independent fail-closed local preview guard',()=>{
 it('requires the explicit server flag and development mode, never checkout flags or query state',()=>{
  expect(localReportPreviewEnabled(env)).toBe(true);
  for(const blocked of [{...env,NODE_ENV:'production'},{...env,NODE_ENV:'test'},{...env,DESTINY_CODE_LOCAL_REPORT_PREVIEW:''},{...env,DESTINY_CODE_LOCAL_REPORT_PREVIEW:'true'},{NODE_ENV:'development',DESTINY_CODE_DEV_CHECKOUT:'1'}])expect(localReportPreviewEnabled(blocked)).toBe(false);
 });
 it('rejects hosted/preview environments even if both development flags are supplied',()=>{for(const key of ['VERCEL','VERCEL_ENV','NETLIFY','CONTEXT','CF_PAGES','RENDER','RAILWAY_ENVIRONMENT_ID','CI'])expect(localReportPreviewEnabled({...env,[key]:'preview'})).toBe(false);});
 it('accepts only exact configured loopback hosts and normal local Next forwarding metadata',()=>{
  expect(localReportPreviewAllowed(request().headers,request().url,env)).toBe(true);
  expect(localReportPreviewAllowed(request('',{'x-forwarded-host':'127.0.0.1:3000','x-forwarded-proto':'http','x-forwarded-port':'3000','x-forwarded-for':'::ffff:127.0.0.1','sec-fetch-site':'same-origin',origin}).headers,request().url,env)).toBe(true);
  for(const host of ['localhost','127.0.0.1','[::1]']){const url=`http://${host}:3000`;expect(localReportPreviewAllowed(new Headers({host:`${host}:3000`}),`${url}/dev/report-preview`,{...env,APP_ORIGIN:url})).toBe(true);}
 });
 it('denies external, spoofed, forwarded, cross-origin and malformed access',()=>{
  for(const host of ['example.com','127.0.0.1.evil.test:3000','localhost.evil.test:3000','192.168.1.2:3000','127.0.0.1:4000','127.1:3000'])expect(localReportPreviewAllowed(new Headers({host}),request().url,env)).toBe(false);
  const invalidHeaders:Record<string,string>[]=[{'x-forwarded-host':'evil.test'},{'x-forwarded-for':'8.8.8.8'},{'x-forwarded-for':'127.0.0.1, 127.0.0.1'},{forwarded:'for=127.0.0.1'},{origin:'https://evil.test'},{origin:'null'},{'sec-fetch-site':'cross-site'},{'sec-fetch-site':'same-site'},{'x-real-ip':'8.8.8.8'},{'cf-connecting-ip':'8.8.8.8'},{'x-forwarded-port':'4000'},{'x-forwarded-proto':'https'}];for(const bad of invalidHeaders)expect(localReportPreviewAllowed(request('',bad).headers,request().url,env)).toBe(false);
  expect(localReportPreviewAllowed(request().headers,'https://example.com/dev/report-preview',env)).toBe(false);expect(localReportPreviewAllowed(request().headers,request().url,{...env,APP_ORIGIN:'https://example.com'})).toBe(false);
 });
});
describe('guarded pages and shared complete output',()=>{
 it.each(['1991-12-09','2005-08-29'])('generates complete content and direct buttons for %s without any order access',async date=>{
  const home=renderToStaticMarkup(await PreviewPage(props({date})));expect(home).toContain('UNPAID PREVIEW');expect(home).toContain('Generate Full Reading');expect(home).toContain('Open Full Report');expect(home).toContain('Download Light PDF');expect(home).toContain('Download Dark PDF');
  const r=composeLocalPreview(date);expect(r).toEqual(composeCandidate(date));expect(r.contentVersion).toBe(FINAL_CONTENT_VERSION);expect(Object.keys(r.values)).toHaveLength(38);expect(r.sections).toHaveLength(11);
  const element=await ReadingPage(props({date}));const html=renderToStaticMarkup(element);expect(html).toContain(r.semanticContentHash);expect(html).toContain('UNPAID LOCAL DEVELOPMENT READING');expect(html).toContain(`/dev/report-preview/pdf?date=${date}&amp;edition=light`);expect(store).not.toHaveBeenCalled();
 });
 it('does not compose anything or expose active links before selecting a date',async()=>{const html=renderToStaticMarkup(await PreviewPage(props()));expect(composeCandidate).not.toHaveBeenCalled();expect(html).toContain('disabled');expect(html).not.toContain('/pdf?date=');});
 it('rejects invalid/future/duplicate dates and unknown flags before full composition',async()=>{
  for(const date of ['2005-02-29','2005-08-29\n','9999-01-01',['1991-12-09','2005-08-29']]){expect(previewDate(date).success).toBe(false);await expect(ReadingPage(props({date}))).rejects.toThrow();}
  await expect(ReadingPage(props({date:'2005-08-29',paid:'1'}))).rejects.toThrow();expect(composeCandidate).not.toHaveBeenCalled();
 });
 it.each(['production','test'])('hides all developer pages and PDF routes in %s',async mode=>{
  vi.stubEnv('NODE_ENV',mode);await expect(PreviewPage(props())).rejects.toThrow();await expect(ReadingPage(props({date:'2005-08-29'}))).rejects.toThrow();const res=await pdf(request());expect(res.status).toBe(404);expect(res.headers.get('Cache-Control')).toContain('no-store');expect(composeCandidate).not.toHaveBeenCalled();expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
 it('disabling the flag immediately denies every URL, even with apparent payment/preview parameters',async()=>{
  vi.stubEnv('DESTINY_CODE_LOCAL_REPORT_PREVIEW','0');await expect(PreviewPage(props({date:'2005-08-29',preview:'1'}))).rejects.toThrow();await expect(ReadingPage(props({date:'2005-08-29'}))).rejects.toThrow();expect((await pdf(request('date=2005-08-29&edition=dark&paid=1'))).status).toBe(404);expect(composeCandidate).not.toHaveBeenCalled();expect(generateCandidatePdf).not.toHaveBeenCalled();
 });
 it('denies external hosts before parsing dates or generating content',async()=>{vi.mocked(headers).mockResolvedValue(new Headers({host:'example.com'}));await expect(PreviewPage(props({date:'2005-08-29'}))).rejects.toThrow();await expect(ReadingPage(props({date:'2005-08-29'}))).rejects.toThrow();expect((await pdf(request('',{host:'example.com'}))).status).toBe(404);expect(composeCandidate).not.toHaveBeenCalled();});
 it('cannot unlock normal paid URLs with the preview flag enabled',async()=>{const params={params:Promise.resolve({date:'2005-08-29'})};await expect(PaidReport(params)).rejects.toThrow();const response=await paidPdf(new Request(`${origin}/report/2005-08-29/pdf?edition=light`),params);expect(response.status).toBe(404);expect(composeCandidate).not.toHaveBeenCalled();expect(generateCandidatePdf).not.toHaveBeenCalled();});
 it('does not alter sample or purchaser download destinations',()=>{
  const r=composeLocalPreview('2005-08-29'),sample=renderToStaticMarkup(<CandidateReading report={r} sample/>),purchased=renderToStaticMarkup(<CandidateReading report={r} reportId="opaque-order-id"/>);
  expect(sample).toContain('/report/demo/pdf?edition=light');expect(sample).not.toContain('/dev/report-preview/pdf');expect(purchased).toContain('/report/opaque-order-id/pdf?edition=light');expect(purchased).not.toContain('/dev/report-preview/pdf');
 });
});
describe('explicit request-based PDF delivery (writer mocked; no PDF batch)',()=>{
 it.each(['light','dark'])('calls the real shared data engine and existing writer for the %s edition',async edition=>{
  const response=await pdf(request(`date=2005-08-29&edition=${edition}`));expect(response.status).toBe(200);expect(response.headers.get('Content-Type')).toBe('application/pdf');expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(response.headers.get('Content-Disposition')).toContain(`unpaid-local-preview-2005-08-29-${edition}`);expect(generateCandidatePdf).toHaveBeenCalledOnce();expect(generateCandidatePdf).toHaveBeenCalledWith(composeCandidate('2005-08-29'),edition);expect(store).not.toHaveBeenCalled();
 });
 it('rejects missing, repeated, invalid or extra query parameters without generating a PDF',async()=>{
  for(const query of ['','date=2005-08-29','date=2005-08-29&date=1991-12-09&edition=light','date=2005-08-29&edition=light&edition=dark','date=2005-02-29&edition=light','date=2005-08-29&edition=unknown','date=2005-08-29&edition=light&preview=1'])expect((await pdf(request(query))).status).toBe(400);expect(generateCandidatePdf).not.toHaveBeenCalled();expect(composeCandidate).not.toHaveBeenCalled();
 });
 it('never generates PDFs as part of loading either page',async()=>{await PreviewPage(props({date:'1991-12-09'}));await ReadingPage(props({date:'1991-12-09'}));expect(generateCandidatePdf).not.toHaveBeenCalled();expect(localPreviewUrls('2005-08-29').report).toBe('/dev/report-preview/reading?date=2005-08-29');});
});
