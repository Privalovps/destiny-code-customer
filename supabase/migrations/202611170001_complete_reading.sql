-- Additive preparation. Apply through the Supabase SQL editor/migration tooling after review.
-- All commerce data is private; browser anon/authenticated roles have no access.
begin;
create schema if not exists destiny_private;
revoke all on schema destiny_private from public, anon, authenticated;
create table destiny_private.customers (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email) and length(email)<=254), created_at timestamptz not null default now()
);
create table destiny_private.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references destiny_private.customers(id),
 birth_date text not null check(birth_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
 product_id text not null default 'destiny-code-complete-reading' check(product_id='destiny-code-complete-reading'),
 amount integer not null default 1290 check(amount=1290), currency text not null default 'USD' check(currency='USD'),
 environment text not null check(environment in ('live','development')),
 status text not null default 'pending' check(status in ('pending','paid','failed','refunded','reversed','disputed')),
 provider text, checkout_id text, payment_id text, created_at timestamptz not null default now(), paid_at timestamptz, revoked_at timestamptz,
 unique(provider,environment,checkout_id), unique(provider,environment,payment_id)
);
create table destiny_private.entitlements (
 order_id uuid primary key references destiny_private.orders(id), customer_id uuid not null references destiny_private.customers(id),
 entitlement_type text not null default 'complete_reading' check(entitlement_type='complete_reading'),
 granted_at timestamptz not null default now(), revoked_at timestamptz
);
create table destiny_private.payment_events (
 provider text not null, environment text not null, event_id text not null, digest text not null, order_id uuid not null references destiny_private.orders(id),
 processed_at timestamptz not null default now(), primary key(provider,environment,event_id)
);
create table destiny_private.credentials (
 hash text primary key check(hash ~ '^[a-f0-9]{64}$'), kind text not null check(kind in ('link','access','checkout')),
 customer_id uuid not null references destiny_private.customers(id), order_id uuid references destiny_private.orders(id),
 environment text not null check(environment in ('live','development')), expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index credentials_expiry on destiny_private.credentials(expires_at);
create table destiny_private.delivery_outbox (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references destiny_private.customers(id), order_id uuid unique references destiny_private.orders(id),
 created_at timestamptz not null default now(), sent_at timestamptz, lease uuid, lease_until timestamptz, attempts integer not null default 0
);
create table destiny_private.rate_limits (key text primary key, expires_at timestamptz not null);
alter table destiny_private.customers enable row level security;
alter table destiny_private.orders enable row level security;
alter table destiny_private.entitlements enable row level security;
alter table destiny_private.payment_events enable row level security;
alter table destiny_private.credentials enable row level security;
alter table destiny_private.delivery_outbox enable row level security;
alter table destiny_private.rate_limits enable row level security;
revoke all on all tables in schema destiny_private from public, anon, authenticated;
-- No browser policies: all access passes explicit server operations below.
create function destiny_private.order_json(o destiny_private.orders) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',(o).id,'customerId',(o).customer_id,'email',c.email,'birthDate',(o).birth_date,'productId',(o).product_id,'amount',(o).amount,'currency',(o).currency,'environment',(o).environment,'status',(o).status,'provider',(o).provider,'checkoutId',(o).checkout_id,'paymentId',(o).payment_id)
 from destiny_private.customers c where c.id=(o).customer_id;
$$;
revoke all on function destiny_private.order_json(destiny_private.orders) from public;
create function public.dc_gateway(operation text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 o destiny_private.orders; c uuid; credential destiny_private.credentials; event_digest text;
 job destiny_private.delivery_outbox; result jsonb; parsed_date date; affected integer;
begin
 if operation='create' then
  -- Validate even when a caller bypasses application validation. No birth timestamp parsing.
  parsed_date := ((input->>'birthDate'))::date;
  if to_char(parsed_date,'YYYY-MM-DD')<>(input->>'birthDate') or parsed_date>current_date or extract(year from parsed_date)<1 then raise exception 'Invalid date'; end if;
  if length((input->>'email'))>254 or (input->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  insert into destiny_private.customers(email) values(lower((input->>'email'))) on conflict(email) do update set email=excluded.email returning id into c;
  insert into destiny_private.orders(customer_id,birth_date,environment) values(c,(input->>'birthDate'),'live') returning * into o;
  return destiny_private.order_json(o);
 elsif operation='bind' then
  update destiny_private.orders set provider=(input->>'provider'),checkout_id=(input->>'checkoutId')
  where id=((input->>'orderId'))::uuid and status='pending' and provider is null returning * into o;
  if not found then raise exception 'Order cannot be rebound'; end if;return null;
 elsif operation='event' then
  select * into o from destiny_private.orders where id=((input->>'orderId'))::uuid for update;
  if not found or o.product_id is distinct from ((input->>'productId')) or o.amount is distinct from ((input->>'amount'))::int or o.currency is distinct from ((input->>'currency'))
   or o.environment is distinct from ((input->>'environment')) or o.provider is distinct from ((input->>'provider')) or o.checkout_id is distinct from ((input->>'checkoutId'))
   or (o.payment_id is not null and o.payment_id<>(input->>'paymentId')) or nullif((input->>'paymentId'),'') is null then raise exception 'Payment mismatch';end if;
  insert into destiny_private.payment_events(provider,environment,event_id,digest,order_id)
   values(o.provider,o.environment,(input->>'eventId'),(input->>'digest'),o.id) on conflict do nothing;
  get diagnostics affected=row_count;
  if affected=0 then
   select digest into event_digest from destiny_private.payment_events where provider=o.provider and environment=o.environment and event_id=(input->>'eventId');
   if event_digest<>(input->>'digest') then raise exception 'Conflicting event'; end if;
   return destiny_private.order_json(o);
  end if;
  if o.payment_id is null then update destiny_private.orders set payment_id=(input->>'paymentId') where id=o.id returning * into o;end if;
  if o.status not in ('refunded','reversed','disputed') and not(o.status='paid' and (input->>'state') in ('pending','failed')) then
   update destiny_private.orders set status=(input->>'state'),payment_id=(input->>'paymentId'),
    paid_at=case when (input->>'state')='paid' then coalesce(paid_at,now()) else paid_at end,
    revoked_at=case when (input->>'state') in ('refunded','reversed','disputed') then now() else revoked_at end
    where id=o.id returning * into o;
  end if;
  if o.status='paid' then
   insert into destiny_private.entitlements(order_id,customer_id) values(o.id,o.customer_id) on conflict do nothing;
   insert into destiny_private.delivery_outbox(customer_id,order_id) values(o.customer_id,o.id) on conflict(order_id) do nothing;
  elsif o.status in ('refunded','reversed','disputed') then
   update destiny_private.entitlements set revoked_at=coalesce(revoked_at,now()) where order_id=o.id;
  end if;
  return destiny_private.order_json(o);
 elsif operation='checkout_token' then
  select * into strict o from destiny_private.orders where id=((input->>'orderId'))::uuid;
  insert into destiny_private.credentials(hash,kind,customer_id,order_id,environment,expires_at)
   values((input->>'hash'),'checkout',o.customer_id,o.id,o.environment,now()+make_interval(secs=>least(((input->>'seconds'))::int,3600)));return null;
 elsif operation='checkout_order' then
  select * into o from destiny_private.orders where id=(select order_id from destiny_private.credentials where hash=(input->>'hash') and kind='checkout' and expires_at>now() and environment=(input->>'environment'));
  return case when o.id is null then null else destiny_private.order_json(o) end;
 elsif operation='link' then
  if not exists(select 1 from destiny_private.orders purchased join destiny_private.entitlements e on e.order_id=purchased.id where purchased.customer_id=((input->>'customerId'))::uuid and purchased.status='paid' and e.revoked_at is null and purchased.environment=(input->>'environment')) then raise exception 'No entitlement';end if;
  insert into destiny_private.credentials(hash,kind,customer_id,environment,expires_at)
   values((input->>'hash'),'link',((input->>'customerId'))::uuid,(input->>'environment'),now()+make_interval(secs=>least(((input->>'seconds'))::int,900)));return null;
 elsif operation='redeem' then
  delete from destiny_private.credentials where hash=(input->>'hash') and kind='link' and expires_at>now() and environment=(input->>'environment') returning * into credential;
  if not found then return null;end if;
  insert into destiny_private.credentials(hash,kind,customer_id,environment,expires_at)
   values((input->>'sessionHash'),'access',credential.customer_id,credential.environment,now()+make_interval(secs=>least(((input->>'sessionSeconds'))::int,2592000)));
  return jsonb_build_object('customerId',credential.customer_id);
 elsif operation in ('authorize','list') then
  select * into credential from destiny_private.credentials where hash=(input->>'hash') and kind='access' and expires_at>now() and environment=(input->>'environment');
  if not found then return case when operation='list' then '[]'::jsonb else null end;end if;
  if operation='authorize' then
   select o1.* into o from destiny_private.orders o1 join destiny_private.entitlements e on e.order_id=o1.id and e.customer_id=o1.customer_id
    where o1.id=((input->>'orderId'))::uuid and o1.customer_id=credential.customer_id and o1.environment=credential.environment and o1.status='paid' and e.revoked_at is null;
   return case when o.id is null then null else destiny_private.order_json(o) end;
  end if;
  select coalesce(jsonb_agg(destiny_private.order_json(o1) order by o1.created_at desc),'[]'::jsonb) into result
   from destiny_private.orders o1 join destiny_private.entitlements e on e.order_id=o1.id and e.customer_id=o1.customer_id
   where o1.customer_id=credential.customer_id and o1.environment=credential.environment and o1.status='paid' and e.revoked_at is null;
  return result;
 elsif operation='queue_recovery' then
  select id into c from destiny_private.customers where email=lower((input->>'email'));
  if c is not null and exists(select 1 from destiny_private.orders purchased join destiny_private.entitlements e on e.order_id=purchased.id where purchased.customer_id=c and purchased.environment='live' and purchased.status='paid' and e.revoked_at is null) then
   insert into destiny_private.delivery_outbox(customer_id) values(c);
  end if;return null;
 elsif operation='claim_mail' then
  select * into job from destiny_private.delivery_outbox d where sent_at is null and attempts<10 and (lease_until is null or lease_until<now())
   and exists(select 1 from destiny_private.orders purchased join destiny_private.entitlements e on e.order_id=purchased.id where purchased.customer_id=d.customer_id and purchased.status='paid' and purchased.environment='live' and e.revoked_at is null)
   order by created_at limit 1 for update skip locked;
  if not found then return null;end if;
  update destiny_private.delivery_outbox set lease=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1 where id=job.id returning * into job;
  return jsonb_build_object('id',job.id,'customerId',job.customer_id,'email',(select email from destiny_private.customers where id=job.customer_id),'lease',job.lease);
 elsif operation='ack_mail' then
  update destiny_private.delivery_outbox set sent_at=now(),lease_until=null where id=((input->>'id'))::uuid and lease=((input->>'lease'))::uuid;return null;
 elsif operation='release_mail' then
  update destiny_private.delivery_outbox set lease_until=now()+interval '5 minutes' where id=((input->>'id'))::uuid and lease=((input->>'lease'))::uuid;return null;
 elsif operation='rate' then
  insert into destiny_private.rate_limits as limits(key,expires_at) values((input->>'key'),now()+make_interval(secs=>least(((input->>'seconds'))::int,3600)))
   on conflict(key) do update set expires_at=excluded.expires_at where limits.expires_at<now();
  get diagnostics affected=row_count;return to_jsonb(affected>0);
 end if;
 raise exception 'Unsupported operation';
end;
$$;
revoke all on function public.dc_gateway(text,jsonb) from public, anon, authenticated;
grant execute on function public.dc_gateway(text,jsonb) to service_role;
commit;
