import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExpandedMatrix } from '@/components/expanded-matrix';
import { freeReading } from './public';
const chart=freeReading('1991-12-09').chart;
describe('full responsive matrix without a scroll viewport',()=>{
 it('scales every rendered hit target with the chart and retains its center without overlapping adjacent targets',()=>{
  const html=renderToStaticMarkup(<ExpandedMatrix chart={chart}/>);
  const targets=[...html.matchAll(/<button[^>]*style="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(match=>Object.fromEntries(match[1].split(';').filter(Boolean).map(property=>property.split(':'))));expect(targets).toHaveLength(30);
  for(const width of [280,335,350,390,430,712,968,1220]){
   const boxes=targets.map(style=>{for(const property of ['left','top','width','height','margin-left','margin-top'])expect(style[property]).toMatch(/%$/);const value=(name:string)=>parseFloat(style[name])/100*width;return {left:value('left')+value('margin-left'),top:value('top')+value('margin-top'),width:value('width'),height:value('height')};});
   for(const box of boxes){expect(box.left).toBeGreaterThanOrEqual(0);expect(box.top).toBeGreaterThanOrEqual(0);expect(box.left+box.width).toBeLessThanOrEqual(width);expect(box.top+box.height).toBeLessThanOrEqual(width);expect(box.width).toBe(box.height);}
   for(let i=0;i<boxes.length;i++)for(const b of boxes.slice(i+1)){const a=boxes[i];expect(a.left+a.width<=b.left||b.left+b.width<=a.left||a.top+a.height<=b.top||b.top+b.height<=a.top).toBe(true);}
  }
 });
 it('retains all 38 dropdown choices, accessible node buttons and a centered square SVG',()=>{
  const html=renderToStaticMarkup(<ExpandedMatrix chart={chart}/>);expect(html).toContain('viewBox="0 0 1000 1000"');expect(html).toContain('preserveAspectRatio="xMidYMid meet"');expect([...html.matchAll(/<option /g)]).toHaveLength(38);expect(html).toContain('aria-live="polite"');expect(html).toContain('aria-pressed="true"');expect(html).not.toContain('Swipe the chart');
 });
});
