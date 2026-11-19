import { failure } from '@/lib/server/http';
import { privatePdfResponse } from '@/lib/server/pdf-response';
import { activeReadingRelease } from '@/lib/methodology/release';
import { candidateSample } from '@/lib/methodology/report';
import { generateCandidatePdf } from '@/lib/methodology/pdf';
import { parsePdfEdition } from '@/lib/pdf-edition';
export const dynamic='force-dynamic';
export const maxDuration=60;
export const runtime='nodejs';
/** Public exception is limited to one server-owned sample. DOB/paid/preview parameters are never authorization. */
export async function GET(request:Request){
 try {
 const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 if(activeReadingRelease()!=='research-c')return new Response(null,{status:404,headers});
 const query=new URL(request.url).searchParams;
 if([...query.keys()].some(key=>key!=='edition')||query.getAll('edition').length>1)return new Response('Choose a sample PDF edition.',{status:400,headers});
 const edition=parsePdfEdition(query.get('edition'));if(!edition)return new Response('Choose Light or Dark.',{status:400,headers});
 const report=candidateSample();return privatePdfResponse(generateCandidatePdf(report,edition,true),`destiny-code-sample-${report.dateOnly}-${edition}.pdf`);
 }catch(error){return failure(error);}
}
