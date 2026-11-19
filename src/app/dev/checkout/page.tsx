import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { AccessActions } from '@/components/access-actions';
import { developmentCheckoutEnabled } from '@/lib/server/config';
import { dateSchema } from '@/lib/numerology';
export const dynamic='force-dynamic';
export const metadata={title:'Unpaid local checkout simulation',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function DevelopmentCheckout({searchParams}:{searchParams:Promise<{date?:string}>}){
 if(!developmentCheckoutEnabled())notFound();
 const host=(await headers()).get('host')??'';if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))notFound();
 const input=dateSchema().safeParse((await searchParams).date);
 return <section className="shell section narrow legal"><div className="demo-badge">LOCAL DEVELOPMENT ONLY · UNPAID SIMULATION</div><h1 className="page-title">Test secure<br/><em>reading access.</em></h1><p>No payment provider, card transaction, email delivery, or provider signature is simulated. Orders live only in this development process and disappear on restart.</p><ol><li>Create a pending test order; check that its report URL denies access.</li><li>Grant a test entitlement, then open and confirm the one-use verification link.</li><li>Open your reading and explicitly download either PDF edition.</li><li>Return here and revoke access; the same report and PDFs must deny access.</li></ol><AccessActions mode="development" date={input.success?input.data:'1993-04-17'}/></section>;
}
