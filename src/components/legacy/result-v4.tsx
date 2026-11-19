import { ArcanaEmblem } from '@/components/arcana-emblem';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ReportPreview } from '@/components/report-preview';
import { calculateMatrix, dateSchema } from '@/lib/numerology';
import { interpretation } from '@/lib/interpretations';
import { positionReading } from '@/lib/position-reading';
import { developmentCheckoutEnabled } from '@/lib/server/config';
import { Chart } from '@/components/chart';
import { BirthForm } from '@/components/birth-form';
import { ShareReading } from '@/components/share-reading';
import { Pricing } from '@/components/shared';
export const metadata:Metadata={title:'Your matrix',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Result({searchParams}:{searchParams:Promise<{date?:string|string[]}>}) {
  const {date}=await searchParams;
  const parsed=dateSchema().safeParse(date);
  if(!parsed.success) return <section className="shell section narrow"><p className="eyebrow">LET’S BEGIN AGAIN</p><h1 className="page-title">A date is all we need.</h1><p role="alert">{typeof date==='string'?parsed.error.issues[0].message:'Enter your birth date to create a matrix.'}</p><BirthForm/></section>;
  const matrix=calculateMatrix(parsed.data);
  const reading=interpretation(matrix.E);
  const local=developmentCheckoutEnabled();
  return <div className="shell">
    <section className="section result-heading">
      <Link className="text-link" href="/">← Try another date</Link>
      <p className="eyebrow">YOUR PERSONAL MATRIX · <time dateTime={parsed.data}>{parsed.data}</time></p>
      <h1 className="page-title">Your center is<br/><em>{reading.name}.</em></h1>
      <p>{reading.theme}. A symbolic beginning, never a fixed definition of you.</p><p className="fine result-scope">This page is your free introduction. The complete eight-chapter reading and PDFs require verified access on a separate report page.</p>{process.env.NODE_ENV==='development'&&!local&&<p className="home-preview-note fine">The unpaid local checkout simulator is disabled. Use the documented development checkout command to test access.</p>}
      <div className="result-actions"><Link prefetch={false} className="button" href={local?`/dev/checkout?date=${parsed.data}`:'#premium-preview'}>Explore My Complete Reading ↗</Link><a className="text-link" href="#your-matrix">Explore my nine positions ↓</a></div>
    </section>
    <section className="result-grid" id="your-matrix" aria-label="Your matrix and free core reading">
      <Chart matrix={matrix}/>
      <article className="reading"><p className="eyebrow">CENTER {matrix.E} / 22 · FREE CORE READING</p><ArcanaEmblem className="reading-emblem" number={matrix.E}/><h2>{reading.name}</h2><p className="theme">{reading.theme}</p><p>{reading.description}</p>
        <h3>Strengths to explore</h3><ul>{reading.strengths.map(s=><li key={s}>{s}</li>)}</ul><h3>A question to sit with</h3><blockquote>{reading.prompt}</blockquote><h3>A small practice</h3><p>{reading.growth}</p>
        <ShareReading number={matrix.E} archetype={reading.name} theme={reading.theme}/>
      </article>
    </section>
    <section className="secondary-reading" aria-labelledby="secondary-title"><div><p className="eyebrow">THREE MORE PERSPECTIVES</p><h2 id="secondary-title">Beyond your center.</h2><p>These are three of the same nine positions, not additional traits or hidden channels. Each pairs a documented calculation with an editorial question.</p></div>
      <div className="secondary-list">{(['A','B','D'] as const).map(key=>{const p=positionReading(matrix,key);return <article key={key}><span className="secondary-number" aria-hidden="true">{String(p.number).padStart(2,'0')}</span><div><p className="tiny">{p.key} / {p.label}</p><h3>{p.arcana.name}</h3><p>{p.reflection}</p><p className="fine"><code>{p.calculation}</code></p></div></article>;})}</div>
    </section>
    <details className="method-details"><summary>See the numbers behind your chart</summary><p>Digit sums are repeated only above 22. These labels describe positions, not universal life meanings.</p><div className="number-list">{Object.entries(matrix).map(([key,value])=><span key={key}>{key}: <strong>{value}</strong></span>)}</div><p>Read <Link href="/methodology">the complete methodology</Link> for formulas and tradition differences.</p></details>
    <ReportPreview date={parsed.data}/><Pricing date={parsed.data}/>
  </div>;
}
