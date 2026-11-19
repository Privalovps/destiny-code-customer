import Link from 'next/link';
import { checkoutStatus } from '@/lib/server/checkout-status';
import { PRODUCT_PRICE } from '@/lib/server/product';
export async function PaymentStatus(){
 const order=await checkoutStatus();
 return <section className="shell section narrow legal"><p className="eyebrow">DESTINY CODE / PAYMENT STATUS</p>{order?.environment==='development'&&<p className="demo-badge">LOCAL SIMULATION · NO PAYMENT COLLECTED</p>}<h1 className="page-title">{order?.status==='paid'?'Reading access confirmed.':order?.status==='pending'?'Awaiting verification.':order?'Payment not completed.':'No verified purchase.'}</h1><p>{PRODUCT_PRICE} — One-time payment. No subscription.</p><p>{order?.status==='paid'?'Access was confirmed on the server. Open your verification email to establish a secure session; a redirect alone never unlocks a reading.':order?.status==='pending'?'Your reading remains locked until the payment provider confirms the transaction. This page does not grant access.':'Purchasing is not available until a real payment provider is connected. No purchase is inferred from this URL.'}</p><Link className="text-link" href="/readings">My purchased readings ↗</Link><p><Link className="text-link" href="/access/recover">Recover access by email</Link></p></section>;
}
