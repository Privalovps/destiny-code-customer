import 'server-only';
import { ServiceError } from './contracts';
import { paymentProvider, emailProvider } from './providers';
import { localDevelopmentEnvironment,type DevelopmentEnvironment } from './development-environment';
export function developmentCheckoutEnabled(env:DevelopmentEnvironment=process.env){return localDevelopmentEnvironment(env)&&env.DESTINY_CODE_DEV_CHECKOUT==='1';}
export function commerceEnvironment(){return developmentCheckoutEnabled()?'development' as const:'live' as const;}
export function appOrigin(){
 const value=process.env.APP_ORIGIN||(process.env.NODE_ENV==='development'?'http://localhost:3000':'');
 if(!value) throw new ServiceError(503,'Access service is not configured.');
 const url=new URL(value);
 if(url.origin!==value||url.username||url.password||(url.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))) throw new ServiceError(503,'Access origin is not configured securely.');
 return url.origin;
}
export function checkoutOperational(){
 if(process.env.ENABLE_LIVE_CHECKOUT!=='1'||developmentCheckoutEnabled()||!paymentProvider()||!emailProvider()||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY||(process.env.DELIVERY_SECRET?.length??0)<32)return false;
 try{return appOrigin().startsWith('https://');}catch{return false;}
}
export function cookieName(kind:'access'|'checkout'){return `${process.env.NODE_ENV==='production'?'__Host-':''}dc_${kind}`;}
export const cookieOptions=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'});
