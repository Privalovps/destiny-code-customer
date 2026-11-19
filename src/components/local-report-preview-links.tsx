import Link from 'next/link';
import { localPreviewUrls } from '@/lib/server/local-report-preview';
/** Link presentation only; every destination independently enforces the server-side local gate. */
export function LocalReportPreviewLinks({date,includeReport=false}:{date?:string;includeReport?:boolean}){
 const urls=date?localPreviewUrls(date):null;
 return <div className="pdf-downloads" aria-label="Development-only report preview actions">
  {includeReport&&(urls?<Link className="button" href={urls.report} prefetch={false}>Open Full Report ↗</Link>:<button className="button" disabled>Open Full Report ↗</button>)}
  {urls?<><a className="button" href={urls.light} download>Download Light PDF ↓</a><a className="button pdf-secondary" href={urls.dark} download>Download Dark PDF ↓</a></>:<><button className="button" disabled>Download Light PDF ↓</button><button className="button pdf-secondary" disabled>Download Dark PDF ↓</button></>}
 </div>;
}
