import { localReportPreviewAllowed,previewDate,composeLocalPreview } from '@/lib/server/local-report-preview';
import { privateHeaders } from '@/lib/server/http';
import { generateCandidatePdf } from '@/lib/methodology/pdf';
import { parsePdfEdition } from '@/lib/pdf-edition';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){
 if(!localReportPreviewAllowed(request.headers,request.url))return new Response(null,{status:404,headers:privateHeaders});
 const query=new URL(request.url).searchParams;
 if([...query.keys()].some(key=>key!=='date'&&key!=='edition')||query.getAll('date').length!==1||query.getAll('edition').length!==1)return new Response('Choose one birth date and one PDF edition.',{status:400,headers:privateHeaders});
 const date=previewDate(query.get('date')),edition=parsePdfEdition(query.get('edition'));
 if(!date.success||!edition)return new Response('Choose a valid birth date and either the light or dark PDF edition.',{status:400,headers:privateHeaders});
 const report=composeLocalPreview(date.data),pdf=generateCandidatePdf(report,edition);
 return new Response(new Uint8Array(pdf),{headers:{...privateHeaders,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="destiny-code-unpaid-local-preview-${date.data}-${edition}.pdf"`}});
}
