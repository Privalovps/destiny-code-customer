import { ReportCover } from './report-cover';
import Link from 'next/link';
import { generateReport } from '@/lib/report';
import { developmentCheckoutEnabled } from '@/lib/server/config';

/** Server-rendered excerpts; the complete reading and download remain gated. */
export function ReportPreview({ date }: { date: string }) {
  const report = generateReport(date);
  const local = developmentCheckoutEnabled();
  const chapters = report.sections.filter(section=>['core-personality','hidden-strengths','love-and-relationships','money-mindset'].includes(section.id));

  return <section className="report-preview" id="premium-preview" aria-labelledby="preview-title">
    <div className="preview-heading">
      <div>
        <p className="eyebrow">YOUR COMPLETE READING / A FIRST LOOK</p>
        <h2 id="preview-title">Nine numbers.<br/><em>More room to reflect.</em></h2>
        <p>This is the free preview for {date}, not the complete report. The full reading includes eight substantial chapters, a detailed guide to every position, and reflective exercises. These are symbolic editorial lenses, not measured traits or predictions.</p>
      </div>
      <ReportCover date={date} number={report.matrix.E} archetype={report.core.name}/>
    </div>
    <div className="personalized-previews">
      {chapters.map((section) => {
        const block = section.blocks[0];
        return <article key={section.id}>
          <p className="tiny">{String(report.sections.indexOf(section)+1).padStart(2,'0')} / {block.position} · ARCANA {block.number}</p>
          <h3>{section.title}</h3>
          <p className="preview-archetype">{block.title}</p>
          <p>{block.paragraphs[0].split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}</p>
          <details><summary>A question to take with you</summary><p>{section.questions[0]}</p></details>
          
        </article>;
      })}
    </div>
    <div className="preview-contents">
      <div><p className="tiny">THE COMPLETE EDITION</p><h3>Eight chapters.<br/>A reading to return to.</h3><p>About {report.readingMinutes} minutes, plus optional exercises. The full PDF includes your chart, all chapters, and the same personalized closing reflection.</p></div>
      <ol>{report.sections.map(section=><li key={section.id}>{section.title}</li>)}</ol>
    </div>
    <div className="preview-access">
      <div><p className="tiny">{local ? 'LOCAL DEVELOPMENT PREVIEW · UNPAID DEMO' : 'COMPLETE READING · PREVIEW ONLY'}</p>
        <h3>{local ? 'Test your complete reading access.' : 'A first look at your reading.'}</h3>
        <p>{local ? 'Create a pending local test order, then grant an unpaid test entitlement and verify access. This simulator does not collect money.' : 'Purchasing is not available. Explore the fictional sample for a longer introduction to the complete reading.'}</p>
      </div>
      <div className="preview-links">{local ? <>
        <Link prefetch={false} className="button" href={`/dev/checkout?date=${date}`}>Test Local Reading Access ↗</Link>

      </> : <Link className="text-link" href="/report/demo">Read the fictional sample ↗</Link>}</div>
    </div>
  </section>;
}
