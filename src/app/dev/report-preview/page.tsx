import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { LocalReportPreviewLinks } from '@/components/local-report-preview-links';
import { localReportPreviewAllowed,previewDate,composeLocalPreview,localPreviewUrls } from '@/lib/server/local-report-preview';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const revalidate=0;
export const metadata={title:'Local unpaid report preview',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function LocalReportPreview({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!localReportPreviewAllowed(await headers()))notFound();
 const query=await searchParams,submitted=query.date!==undefined,parsed=previewDate(query.date);
 const invalid=Object.keys(query).some(key=>key!=='date')||(submitted&&!parsed.success);
 const report=!invalid&&submitted&&parsed.success?composeLocalPreview(parsed.data):null;
 const date=report?.dateOnly,urls=date?localPreviewUrls(date):null;
 return <section className="shell section narrow legal">
  <div className="demo-badge">LOCAL DEVELOPMENT ONLY · UNPAID PREVIEW</div>
  <h1 className="page-title">Preview a complete<br/><em>personal reading.</em></h1>
  <p>This owner tool uses the same 38-value calculation, complete reading and PDF generators as the candidate product. It creates no payment order, purchase status, account or entitlement.</p>
  <form className="birth-form" method="get" action="/dev/report-preview">
   <label htmlFor="preview-date">Date of birth</label><div className="form-row"><input id="preview-date" name="date" type="date" required defaultValue={parsed.success?parsed.data:'1991-12-09'} aria-invalid={invalid} aria-describedby={invalid?'preview-date-error':'preview-date-note'}/><button className="button" type="submit">Generate Full Reading</button></div>
   {invalid?<p className="error" role="alert" id="preview-date-error">Enter one real birth date that is not in the future. Only the date field is accepted.</p>:<p className="fine" id="preview-date-note">For example: December 9, 1991, or August 29, 2005. Dates are used for this request and are not saved by this tool.</p>}
  </form>
  {report&&<><h2>Your unpaid preview is ready.</h2><p>{report.dateOnly} · Center {report.values.core} · Ten chapters and the full calculation reference.</p><p className="fine">Method: {report.methodologyVersion} / {report.calculationProfile}. Content: {report.contentVersion}.</p></>}
  <LocalReportPreviewLinks date={date} includeReport/>
  {urls&&<><h2>Direct local links</h2><ul><li><a href={urls.report}>Full report: {urls.report}</a></li><li><a href={urls.light} download>Light PDF: {urls.light}</a></li><li><a href={urls.dark} download>Dark PDF: {urls.dark}</a></li></ul></>}
  <p className="fine">No real payment occurred. These links stop working when the server-side preview flag is disabled. Normal purchased-report routes still require their existing verified entitlement.</p>
 </section>;
}
