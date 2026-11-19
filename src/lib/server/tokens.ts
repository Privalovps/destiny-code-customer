import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export const LINK_SECONDS=15*60,SESSION_SECONDS=30*24*60*60,CHECKOUT_SECONDS=60*60;
export function randomToken(){return randomBytes(32).toString('base64url');}
export function tokenHash(value:string){return createHash('sha256').update(value).digest('hex');}
export function validToken(value:unknown):value is string{return typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);}
export function secretMatches(value:string,expected:string){const a=Buffer.from(value),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
