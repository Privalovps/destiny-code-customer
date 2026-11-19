import 'server-only';
import { dateSchema } from '../numerology';
import { composeCandidate } from '../methodology/report';
import { localDevelopmentEnvironment } from './development-environment';

type Environment=Record<string,string|undefined>;
type RequestHeaders=Pick<Headers,'get'>;
const loopbackHosts=new Set(['localhost','127.0.0.1','[::1]']);
const loopbackPeers=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
export function localReportPreviewEnabled(env:Environment=process.env){return localDevelopmentEnvironment(env)&&env.DESTINY_CODE_LOCAL_REPORT_PREVIEW==='1';}
/** Host checks supplement, never replace, starting the server bound to 127.0.0.1. */
export function localReportPreviewAllowed(headers:RequestHeaders,requestUrl?:string,env:Environment=process.env){
 if(!localReportPreviewEnabled(env))return false;
 try{
  const configured=env.APP_ORIGIN||'http://127.0.0.1:3000',origin=new URL(configured);
  if(origin.origin!==configured||origin.username||origin.password||!loopbackHosts.has(origin.hostname)||!['http:','https:'].includes(origin.protocol))return false;
  const host=headers.get('host');if(!host||host.toLowerCase()!==origin.host.toLowerCase())return false;
  if(requestUrl){const url=new URL(requestUrl);if(!loopbackHosts.has(url.hostname)||url.protocol!==origin.protocol||url.port!==origin.port||url.username||url.password)return false;}
  if(headers.get('forwarded'))return false;
  const forwardedHost=headers.get('x-forwarded-host');if(forwardedHost&&forwardedHost.toLowerCase()!==host.toLowerCase())return false;
  const forwardedProto=headers.get('x-forwarded-proto');if(forwardedProto&&forwardedProto!==origin.protocol.slice(0,-1))return false;
  const forwardedPort=headers.get('x-forwarded-port');if(forwardedPort&&forwardedPort!==(origin.port||(origin.protocol==='https:'?'443':'80')))return false;
  for(const name of ['x-forwarded-for','x-real-ip','cf-connecting-ip']){const peer=headers.get(name);if(peer&&!loopbackPeers.has(peer.toLowerCase()))return false;}
  const requestOrigin=headers.get('origin');if(requestOrigin&&requestOrigin!==origin.origin)return false;
  const site=headers.get('sec-fetch-site');if(site&&site!=='none'&&site!=='same-origin')return false;
  return true;
 }catch{return false;}
}
export function previewDate(value:unknown){return dateSchema().safeParse(value);}
/** Call only after the local request gate. Same calculation/content pipeline as authorized candidate orders. */
export function composeLocalPreview(date:string){const parsed=previewDate(date);if(!parsed.success)throw new Error('Enter a valid birth date that is not in the future.');return composeCandidate(parsed.data);}
export function localPreviewUrls(date:string){const value=encodeURIComponent(date);return {report:`/dev/report-preview/reading?date=${value}`,light:`/dev/report-preview/pdf?date=${value}&edition=light`,dark:`/dev/report-preview/pdf?date=${value}&edition=dark`};}
