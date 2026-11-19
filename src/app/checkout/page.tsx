import { AccessActions } from '@/components/access-actions';
import { PRODUCT, PRODUCT_PRICE } from '@/lib/server/product';
import { checkoutOperational } from '@/lib/server/config';
import { dateSchema } from '@/lib/numerology';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Unlock Your Complete Reading',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Checkout({searchParams}:{searchParams:Promise<{date?:string}>}){
 const input=await searchParams;const date=dateSchema().safeParse(input.date);const available=checkoutOperational();
 return <section className="shell section narrow legal"><p className="eyebrow">DESTINY CODE / THE COMPLETE READING</p><h1 className="page-title">Unlock Your<br/><em>Complete Reading</em></h1><h2>{PRODUCT_PRICE} — One-time payment</h2><p>No subscription.</p><ul>{PRODUCT.features.map(feature=><li key={feature}>{feature}</li>)}</ul><p>{available?'Instant access after payment. No subscription.':'Purchasing is not available yet. No payment will be collected.'}</p><AccessActions mode="checkout" date={date.success?date.data:''} available={available}/><Link className="text-link" href="/access/recover">Already purchased? Recover access ↗</Link></section>;
}
