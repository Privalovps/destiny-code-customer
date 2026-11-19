import 'server-only';
import { developmentCheckoutEnabled } from './config';
import type { Order } from './contracts';
import { activeReadingRelease,type ReadingRelease } from '../methodology/release';
import { generateReport } from '../report';
import { composeCandidate } from '../methodology/report';
const processState=globalThis as typeof globalThis & {destinyReportEditions?:Map<string,ReadingRelease>};
/** Sidecar metadata only for the existing volatile local simulator. No entitlement is granted here. */
export function registerLocalReportEdition(orderId:string){
 if(!developmentCheckoutEnabled())throw new Error('Local report registration is disabled.');
 const editions=processState.destinyReportEditions??(processState.destinyReportEditions=new Map());
 if(editions.has(orderId))return;if(editions.size>=200)throw new Error('Restart the local simulator to clear test editions.');editions.set(orderId,activeReadingRelease());
}
export function reportEditionForOrder(order:Pick<Order,'id'|'environment'>):ReadingRelease{
 // Existing orders have no version fields: NEVER infer a new method from their DOB or current public release.
 return developmentCheckoutEnabled()&&order.environment==='development'?(processState.destinyReportEditions?.get(order.id)??'legacy-v4'):'legacy-v4';
}
/** The caller must first obtain this order through the existing server entitlement check. No date/URL override. */
export function readingForAuthorizedOrder(order:Order){return reportEditionForOrder(order)==='research-c'?{edition:'research-c' as const,report:composeCandidate(order.birthDate)}:{edition:'legacy-v4' as const,report:generateReport(order.birthDate)};}
export function readingCacheKey(order:Order){const result=readingForAuthorizedOrder(order);return result.edition==='research-c'?JSON.stringify([order.id,result.report.methodologyVersion,result.report.calculationProfile,result.report.contentVersion,result.report.reportSchemaVersion,result.report.sourceDataHash,result.report.locale,result.report.semanticContentHash]):JSON.stringify([order.id,'dc-nine-digit-sum-v1','4.0','en-US']);}
