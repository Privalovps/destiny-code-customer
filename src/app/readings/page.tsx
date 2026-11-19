import Link from 'next/link';
import { purchasedReadings } from '@/lib/server/access';
export const dynamic='force-dynamic';
export const metadata={title:'My readings',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Readings(){const readings=await purchasedReadings();return <section className="shell section narrow legal"><p className="eyebrow">YOUR PERSONAL LIBRARY</p><h1 className="page-title">Readings to<br/><em>return to.</em></h1>{readings.length?<ul>{readings.map(order=><li key={order.id}><Link href={`/report/${order.id}`} prefetch={false}>Complete personal reading · {order.birthDate} ↗</Link>{order.environment==='development'?' · Unpaid development simulation':''}</li>)}</ul>:<p>No active purchased readings are available in this session.</p>}<Link className="text-link" href="/access/recover">Recover access by email ↗</Link></section>;}
