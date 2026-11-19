import type { Metadata } from 'next';
import { CandidateReading } from '@/components/candidate-reading';
import { FullReading } from '@/components/full-reading';
import { Pricing } from '@/components/shared';
import { candidateSample } from '@/lib/methodology/report';
import { activeReadingRelease } from '@/lib/methodology/release';
import { getSampleReport } from '@/lib/sample-report';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Complete sample reading · Fixed example'};
/** No visitor date or public preview flag is accepted. */
export default function Demo(){return <>{activeReadingRelease()==='research-c'?<CandidateReading report={candidateSample()} sample/>:<FullReading report={getSampleReport()} sample/>}<div className="shell"><Pricing/></div></>;}
