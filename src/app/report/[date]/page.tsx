import { CandidateReading } from '@/components/candidate-reading';
import { readingForAuthorizedOrder } from '@/lib/server/report-editions';
import { FullReading } from '@/components/full-reading';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dateSchema } from '@/lib/numerology';
import { authorizedOrder } from '@/lib/server/access';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'Your complete personal reading',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function FullReport({params}:{params:Promise<{date:string}>}) {
  // The opaque route ID is not proof of purchase. Check the session and current entitlement first.
  const {date:reportId}=await params;
  const order=await authorizedOrder(reportId);
  if(!order) notFound();
  const date=order.birthDate;
  const parsed=dateSchema().safeParse(date);
  if(!parsed.success) notFound();
  const reading=readingForAuthorizedOrder(order);
  return reading.edition==='research-c'?<CandidateReading report={reading.report} reportId={reportId} development={order.environment==='development'}/>:<FullReading report={reading.report} reportId={reportId} development={order.environment==='development'}/>;
}
