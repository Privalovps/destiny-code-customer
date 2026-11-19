import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CandidateReading } from '@/components/candidate-reading';
import { localReportPreviewAllowed,previewDate,composeLocalPreview } from '@/lib/server/local-report-preview';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const revalidate=0;
export const metadata={title:'Unpaid local full-reading preview',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function LocalFullReading({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!localReportPreviewAllowed(await headers()))notFound();
 const query=await searchParams,parsed=previewDate(query.date);
 if(Object.keys(query).some(key=>key!=='date')||!parsed.success)notFound();
 const report=composeLocalPreview(parsed.data);
 return <><div className="shell"><Link className="text-link" href={`/dev/report-preview?date=${report.dateOnly}`} prefetch={false}>← Choose another local preview date</Link></div><CandidateReading report={report} development localPreview/></>;
}
