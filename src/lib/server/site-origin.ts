import 'server-only';
/** Public metadata only. Payment redirects retain their independent strict APP_ORIGIN validation. */
export function publicSiteOrigin(env:Record<string,string|undefined>=process.env){
 const value=env.NEXT_PUBLIC_SITE_URL||env.APP_ORIGIN||(env.VERCEL_PROJECT_PRODUCTION_URL?`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`:env.VERCEL_URL?`https://${env.VERCEL_URL}`:env.NODE_ENV==='production'?'':'http://localhost:3000');
 if(!value)throw new Error('Configure NEXT_PUBLIC_SITE_URL or a Vercel deployment URL.');
 const url=new URL(value),local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.origin!==value||url.username||url.password||(url.protocol!=='https:'&&!(env.NODE_ENV!=='production'&&local&&url.protocol==='http:'))||(env.NODE_ENV==='production'&&local))throw new Error('Public site origin must be a valid HTTPS origin on deployments.');
 return url;
}
