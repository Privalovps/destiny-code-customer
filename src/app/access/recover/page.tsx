import { AccessActions } from '@/components/access-actions';
import { emailProvider } from '@/lib/server/providers';
export const dynamic='force-dynamic';
export const metadata={title:'Recover reading access',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Recover(){const available=!!emailProvider();return <section className="shell section narrow legal"><p className="eyebrow">A READING TO RETURN TO</p><h1 className="page-title">Your reading,<br/><em>revisited.</em></h1><p>Use the email address associated with your purchase. A private, time-limited verification link lets you return without creating an account.</p>{!available&&<p>Email recovery is not available yet. No email will be sent.</p>}<AccessActions mode="recover" available={available}/></section>;}
