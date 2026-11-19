import { failure } from '@/lib/server/http';
import { privatePdfResponse } from '@/lib/server/pdf-response';
import { readingForAuthorizedOrder } from '@/lib/server/report-editions';
import { generateCandidatePdf } from '@/lib/methodology/pdf';
import { parsePdfEdition } from '@/lib/pdf-edition';
import { authorizedOrder } from '@/lib/server/access';
import { dateSchema } from '@/lib/numerology';
import { generateReportPdf } from '@/lib/report-pdf';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration=60;
export async function GET(request: Request, {params}:{params:Promise<{date:string}>}) {
 try {
  const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
  const {date:reportId}=await params;
  const order=await authorizedOrder(reportId);
  if(!order) return new Response(null,{status:404,headers});
  const date=order.birthDate;
  const parsed=dateSchema().safeParse(date);
  if(!parsed.success) return new Response('Invalid calendar date.',{status:400,headers});
  const editions=new URL(request.url).searchParams.getAll('edition');
  const edition=parsePdfEdition(editions[0]??null);
  if(!edition||editions.length>1) return new Response('Choose either the light or dark PDF edition.',{status:400,headers});
  const reading=readingForAuthorizedOrder(order);
  const pdf=reading.edition==='research-c'?generateCandidatePdf(reading.report,edition):generateReportPdf(reading.report,edition);
  return privatePdfResponse(pdf,`destiny-code-${parsed.data}-${edition}.pdf`);
 }catch(error){return failure(error);}
}
