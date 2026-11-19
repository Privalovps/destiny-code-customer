import type { Metadata } from 'next';
import Link from 'next/link';
import LegacyResult from '@/components/legacy/result-v4';
import { ExpandedMatrix } from '@/components/expanded-matrix';
import matrixStyles from '@/components/expanded-matrix.module.css';
import { ReportCover } from '@/components/report-cover';
import { ShareReading } from '@/components/share-reading';
import { Pricing } from '@/components/shared';
import { BirthForm } from '@/components/birth-form';
import { CandidateEmblem } from '@/components/candidate-emblem';
import { dateSchema } from '@/lib/numerology';
import { freeReading } from '@/lib/methodology/public';
import { activeReadingRelease } from '@/lib/methodology/release';
import { sectionData } from '@/lib/methodology/data';
import { developmentCheckoutEnabled } from '@/lib/server/config';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Your Destiny Matrix',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Result(props:{searchParams:Promise<{date?:string|string[]}>}){
 if(activeReadingRelease()==='legacy-v4')return LegacyResult(props);
 const {date}=await props.searchParams,parsed=dateSchema().safeParse(date);
 if(!parsed.success)return <section className="shell section narrow"><h1 className="page-title">A date is all we need.</h1><p role="alert">Enter a valid birth date to begin.</p><BirthForm/></section>;
 const {preview,chart}=freeReading(parsed.data),core=chart.nodes.find(n=>n.id==='core')!;
 return <div className="shell"><section className="section result-heading"><Link className="text-link" href="/">← Try another date</Link><p className="eyebrow">YOUR PERSONAL MATRIX / {parsed.data}</p><h1 className="page-title">Your center is<br/><em>{core.archetype}.</em></h1><p>This is your free numerical matrix and introduction. The complete reading explores the distinct roles behind the numbers.</p></section><section className={`result-grid ${matrixStyles.readingLayout}`}><ExpandedMatrix chart={chart}/><article className="reading">{preview.positions.map(position=>{const node=chart.nodes.find(n=>n.id===position.id)!;return <section key={position.id}><p className="eyebrow">{node.label} / {node.number}</p><CandidateEmblem number={node.number} name={node.archetype}/><h2>{node.archetype}</h2><p className="theme">{position.coreSymbolicMeaning}.</p></section>;})}<p className="fine">{preview.disclosure}</p><ShareReading number={core.number} archetype={core.archetype} theme={preview.positions.find(p=>p.id==='core')!.coreSymbolicMeaning}/></article></section>
 <section className="report-preview" id="premium-preview"><div className="preview-heading"><div><p className="eyebrow">YOUR COMPLETE PERSONAL READING</p><h2>Distinct roles.<br/><em>Connected themes.</em></h2><p>The complete reading explores your talents, relationship and money channels, family branches, recurring lessons, purposes and practical integration. These are symbolic perspectives, not predictions.</p><ol>{sectionData.map(section=><li key={section.id}>{section.title}</li>)}</ol><Link className="text-link" href="/report/demo">Read the complete fixed sample ↗</Link>{developmentCheckoutEnabled()&&<p><Link className="text-link" prefetch={false} href={`/dev/checkout?date=${parsed.data}`}>Test unpaid local reading access ↗</Link></p>}</div><ReportCover date={parsed.data} number={core.number} archetype={core.archetype} numbering="candidate"/></div></section><Pricing date={parsed.data}/></div>;
}
