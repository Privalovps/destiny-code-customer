'use client';
import { useEffect, useRef, useState } from 'react';
export function AccessActions({mode,date='',available=false}:{mode:'checkout'|'recover'|'verify'|'development';date?:string;available?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const token=useRef('');
 const [links,setLinks]=useState<{verificationUrl?:string;reportUrl?:string}>({});
 useEffect(()=>{if(mode==='verify'){const fragment=new URLSearchParams(window.location.hash.slice(1));const value=fragment.get('token');if(value){token.current=value;window.history.replaceState(null,'',window.location.pathname);}}},[mode]);
 async function submit(form:FormData,action?:string){setBusy(true);setMessage('');try{
  const endpoint=mode==='development'?'/api/dev/checkout':mode==='verify'?'/api/access/redeem':mode==='recover'?'/api/access/recover':'/api/checkout';
  const body=mode==='verify'?{token:token.current}:mode==='recover'?{email:form.get('email')}:mode==='development'?{action:action??'create',...(action&&action!=='create'?{}:{email:form.get('email'),birthDate:form.get('birthDate')})}:{email:form.get('email'),birthDate:form.get('birthDate')};
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const data=await response.json();
  if(!response.ok)throw new Error(data.error??'Please try again.');
  if(data.url){window.location.assign(data.url);return;}
  setLinks(data);setMessage(data.message??'Request received.');
 }catch(error){setMessage(error instanceof Error?error.message:'Please try again.');}finally{setBusy(false);}}
 if(mode==='verify')return <div><p>Confirm this one-use link to open your purchased readings. Verification links expire after 15 minutes.</p><button className="button" disabled={busy} onClick={()=>submit(new FormData())}>{busy?'Verifying…':'Open My Readings'}</button><p role="status">{message}</p><a className="text-link" href="/access/recover">Request a new link</a></div>;
 return <div><form className="commerce-form" onSubmit={event=>{event.preventDefault();void submit(new FormData(event.currentTarget));}}>
  <label>Email address<input type="email" name="email" required autoComplete="email" maxLength={254} disabled={busy||(!available&&mode!=='development')}/></label>
  {mode!=='recover'&&<label>Birth date<input type="date" name="birthDate" required defaultValue={date} disabled={busy||(!available&&mode!=='development')}/></label>}
  <button className="button" disabled={busy||(!available&&mode!=='development')}>{busy?'Please wait…':mode==='development'?'Create pending test order':mode==='recover'?'Send Verification Link':'Unlock My Complete Reading'}</button>
 </form>{mode==='development'&&<div className="report-actions"><button className="button" disabled={busy} onClick={()=>submit(new FormData(),'pay')}>Grant unpaid test entitlement</button><button className="button pdf-secondary" disabled={busy} onClick={()=>submit(new FormData(),'revoke')}>Revoke test entitlement</button></div>}
 <p role="status">{message}</p>{links.verificationUrl&&<p><a className="text-link" href={links.verificationUrl}>Open one-use local verification link</a></p>}{links.reportUrl&&<p><a className="text-link" href={links.reportUrl}>Check full report access ↗</a></p>}</div>;
}
