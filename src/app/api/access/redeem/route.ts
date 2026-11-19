import { cookies } from 'next/headers';
import { z } from 'zod';
import { commerceEnvironment, cookieName, cookieOptions } from '@/lib/server/config';
import { ServiceError } from '@/lib/server/contracts';
import { failure, jsonBody, privateHeaders, sameOrigin } from '@/lib/server/http';
import { store } from '@/lib/server/store';
import { SESSION_SECONDS, randomToken, tokenHash } from '@/lib/server/tokens';
export const runtime='nodejs';
export async function POST(request:Request){try{
 sameOrigin(request);const input=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/)}).strict().safeParse(await jsonBody(request));
 if(!input.success)throw new ServiceError(400,'This verification link is invalid.');
 const session=randomToken();const result=await store().call('redeem',{hash:tokenHash(input.data.token),sessionHash:tokenHash(session),sessionSeconds:SESSION_SECONDS,environment:commerceEnvironment()});
 if(!result)throw new ServiceError(401,'This link has expired or has already been used. Request a new link.');
 (await cookies()).set(cookieName('access'),session,{...cookieOptions(),maxAge:SESSION_SECONDS});
 return Response.json({url:'/readings'},{headers:privateHeaders});
}catch(error){return failure(error);}}
