import { AccessActions } from '@/components/access-actions';
export const dynamic='force-dynamic';
export const metadata={title:'Verify reading access',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Verify(){return <section className="shell section narrow legal"><p className="eyebrow">PRIVATE READING ACCESS</p><h1 className="page-title">Welcome<br/><em>back.</em></h1><AccessActions mode="verify"/></section>;}
