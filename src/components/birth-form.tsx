'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatBirthDateEntry, parseBirthDateEntry } from '@/lib/birth-date-entry';
import { ArrowIcon } from './arrow-icon';
export function BirthForm({submitLabel='Discover My Destiny Matrix'}:{submitLabel?:string}={}) {
  const [date,setDate]=useState('');
  const [error,setError]=useState('');
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  return <form className="birth-form" onSubmit={event=>{
    event.preventDefault();
    const result=parseBirthDateEntry(date);
    if(!result.success){
      const issue=result.error.issues[0];
      setError(issue.code==='custom'?issue.message:'Enter your birth date as DD.MM.YYYY.');
      return;
    }
    setError('');startTransition(()=>router.push(`/result?date=${result.data}`));
  }} noValidate aria-busy={pending}>
    <label htmlFor="birth-date" className="tiny">YOUR DATE OF BIRTH</label>
    <div className="form-row"><input id="birth-date" name="birth-date" type="text" inputMode="numeric" placeholder="DD.MM.YYYY" spellCheck={false} required autoComplete="bday" value={date} onChange={event=>{setDate(formatBirthDateEntry(event.target.value));setError('');}} aria-invalid={!!error} aria-describedby={error?'date-error':'date-note'}/>
      <button className="button" disabled={pending} type="submit">{pending?'Opening your reading…':submitLabel}<ArrowIcon/></button></div>
    {error?<p id="date-error" role="alert" className="error">{error}</p>:<p id="date-note" className="fine">Your first reading is free. No birth time, account, or payment needed.</p>}
  </form>;
}
