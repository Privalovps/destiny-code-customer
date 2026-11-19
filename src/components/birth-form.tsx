'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { dateSchema } from '@/lib/numerology';
export function BirthForm({submitLabel='Discover My Destiny Matrix'}:{submitLabel?:string}={}) {
  const [date,setDate]=useState('');
  const [error,setError]=useState('');
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  return <form className="birth-form" onSubmit={event=>{
    event.preventDefault();
    const result=dateSchema().safeParse(date);
    if(!result.success){setError(result.error.issues[0].message);return;}
    setError('');startTransition(()=>router.push(`/result?date=${result.data}`));
  }} noValidate aria-busy={pending}>
    <label htmlFor="birth-date" className="tiny">YOUR DATE OF BIRTH</label>
    <div className="form-row"><input id="birth-date" name="birth-date" type="date" required autoComplete="bday" value={date} onChange={event=>{setDate(event.target.value);setError('');}} aria-invalid={!!error} aria-describedby={error?'date-error':'date-note'}/>
      <button className="button" disabled={pending} type="submit">{pending?'Opening your reading…':submitLabel}<span aria-hidden="true">↗</span></button></div>
    {error?<p id="date-error" role="alert" className="error">{error}</p>:<p id="date-note" className="fine">Your first reading is free. No birth time, account, or payment needed.</p>}
  </form>;
}
