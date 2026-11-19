import { getSampleReport, SAMPLE_DATE } from '@/lib/sample-report';
import Link from 'next/link';
import { developmentCheckoutEnabled } from '@/lib/server/config';
import { PRODUCT_PRICE } from '@/lib/server/product';
import { LandingHero } from '@/components/landing-hero';
import { Reveal } from '@/components/reveal';
import { ReportCover } from '@/components/report-cover';
import { Pricing, Star } from '@/components/shared';

const faq = [
  ['What is a Destiny Matrix?', 'A symbolic numerology diagram built from a birth date using 22 archetypes. We use one documented nine-position variant. It offers a vocabulary for reflection, not a scientific assessment of who you are.'],
  ['How are my numbers calculated?', 'Your day, month, and year digits produce four cardinal values, four adjacent sums, and a center. Values above 22 are reduced by repeated decimal digit sums. Our methodology shows every formula and a worked example.'],
  ['What is included for free?', 'Your interactive nine-position chart, original center interpretation, three secondary perspectives, reflection prompts, and selected personalized report excerpts. No account or payment is required.'],
  ['What does the complete reading include?', `Complete 8-chapter personalized reading, all nine documented positions, reflection exercises, full online access, and Light & Dark PDF editions. ${PRODUCT_PRICE} USD, one-time payment. No subscription. Purchasing is not available yet.`],
  ['Is this a prediction?', 'No. Numerology is not scientifically validated. It cannot establish facts about your personality, predict events, determine compatibility, or replace professional advice. Keep what helps you reflect and question what does not.'],
  ['Do I need my birth time or birthplace?', 'No. This variant uses only your calendar date of birth. Birth time, location, name, and partner information do not enter these calculations.'],
  ['How will purchases and downloads work?', 'Checkout is not available yet. Before sales begin, real payment and email providers must be connected, secure delivery and purchase verification tested, and fulfillment support prepared. A browser redirect or a payment-looking URL will never be proof of purchase.'],
  ['Do you save my birth date?', 'Free results do not require an account. Your date appears in result URLs, browser history, and potentially hosting access logs. Purchased reading access is prepared to store your selected date and email securely. Purchasing is not enabled yet. Read our privacy template for details.'],
];
export default function Home() {
  const sampleReading=getSampleReport();
  const matrix=sampleReading.matrix;
  const sample=sampleReading.core;
  const local=developmentCheckoutEnabled();
  return <>
    <LandingHero matrix={matrix} localPreview={local}/>
    <div className="principles"><div className="shell"><span>22 symbolic archetypes</span><span>Nine transparent calculations</span><span>Your perspective comes first</span></div></div>
    <section className="section shell" id="how-it-works"><Reveal><div className="split-heading"><div><p className="eyebrow">A MOMENT FOR YOURSELF</p><h2>Look inward.<br/><em>Start with a date.</em></h2></div><p>A clear calculation. Original symbolic writing. Room to disagree, discover, and put an idea into your own words.</p></div><div className="steps">{[
      ['01','Enter your birth date','No birth time, birthplace, or account. Just a calendar date and a moment of curiosity.'],
      ['02','Explore your personal matrix','Select each position, follow its calculation, and read your free center interpretation.'],
      ['03','Unlock your full reading','The complete reading brings eight chapters and Light & Dark PDF editions. Purchasing is coming soon; no payment is collected today.'],
    ].map(([n,title,copy])=><article key={n}><span className="step-number">{n}<Star/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></Reveal></section>
    <section className="sample-section" aria-labelledby="sample-title"><div className="shell product-preview-layout"><div>
      <p className="eyebrow">INSIDE THE READING / FICTIONAL EXAMPLE</p><h2 id="sample-title">A reading to return to.<br/><em>A question to grow with.</em></h2>
      <div className="sample-excerpt"><span className="tiny">CENTER {matrix.E} / {sample.name.toUpperCase()}</span><h3>{sample.theme}.</h3><p>{sampleReading.sections[1].blocks[0].paragraphs[0]}</p><blockquote>{sample.prompt}</blockquote></div>
      <div className="sample-chapters"><p className="tiny">EIGHT CHAPTERS / ONE CONNECTED READING</p><ol>{sampleReading.sections.map(section=>section.title).map(title=><li key={title}>{title}</li>)}</ol></div>
      <Link className="text-link" href="/report/demo">Read the fictional sample ↗</Link><p className="fine">The public sample is one fixed complete example, not access to a purchased report.</p>
    </div><div className="sample-cover-stack"><ReportCover date={SAMPLE_DATE} number={matrix.E} archetype={sample.name} sample/><div className="sample-pdf-note"><Star/><div><p className="tiny">DESIGNED TO KEEP</p><p>Sharp vector matrix. Readable type. Space to return to your questions.</p><p className="fine">Light & Dark PDF editions accompany the complete reading. Purchasing is not enabled yet.</p></div></div></div></div></section>
    <section className="section shell benefits" aria-labelledby="benefits-title"><div><p className="eyebrow">MORE THAN A NUMBER</p><h2 id="benefits-title">Something to explore.<br/><em>Something to keep.</em></h2><p>Your date selects the symbols. Your experience gives the reflection its meaning.</p></div><div className="benefit-list">{[
      ['01','A reading shaped by your matrix','Every chapter names its source positions. No random text, invented biography, or hidden extra calculation.'],
      ['02','An understandable chart','Select a node to see its value, formula, and symbolic role. You can follow the arithmetic yourself.'],
      ['03','Questions with room for your answer','Explore strengths, tensions, values, and small practices. Disagreement is part of reflection.'],
      ['04','A considered digital keepsake','The PDF follows the same reading as the web edition, with chapter breaks, your matrix, and reflection prompts.'],
    ].map(([n,title,copy])=><article key={n}><span className="tiny">{n}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>
    <div className="shell"><Pricing/></div>
    <section className="section shell faq"><div><p className="eyebrow">A FEW THINGS TO KNOW</p><h2>Curiosity, welcomed.</h2><Link className="text-link" href="/methodology">Explore our method ↗</Link></div><div>{faq.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="closing shell"><Star/><h2>Your story is still being written.</h2><p>Let a new question be the next chapter.</p><a className="text-link" href="#birth-date">Discover my destiny matrix ↑</a></section>
  </>;
}
