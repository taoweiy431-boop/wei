-- Supabase schema for 三角洲俱乐部抢单系统
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Profiles: mirror of auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role text not null check (role in ('worker','csr','admin')),
  reputation numeric not null default 100,
  created_at timestamp with time zone not null default now()
);

-- Create row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username','用户'), 'worker')
  on conflict (id) do nothing;
  return new;
end;$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reward numeric not null default 0,
  expires_at timestamp with time zone,
  status text not null check (status in ('open','claimed','assigned','completed','cancelled')) default 'open',
  created_by uuid references auth.users(id),
  claimed_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  claimed_at timestamp with time zone,
  completed_at timestamp with time zone
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_expires on public.tasks(expires_at);

-- Claims
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  claimer_id uuid not null references auth.users(id),
  status text not null check (status in ('claimed','assigned','completed','failed')) default 'claimed',
  claimed_at timestamp with time zone not null default now()
);
create index if not exists idx_claims_task on public.claims(task_id);
create index if not exists idx_claims_user on public.claims(claimer_id);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  worker_id uuid not null references auth.users(id),
  amount numeric not null default 0,
  status text not null check (status in ('pending','paid','cancelled')) default 'pending',
  created_at timestamp with time zone not null default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  at timestamp with time zone not null default now(),
  meta jsonb
);

-- RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.claims enable row level security;
alter table public.transactions enable row level security;

-- Only authenticated users may read profiles; users can read their own
create policy profiles_read_self on public.profiles
for select using (auth.role() = 'authenticated' and id = auth.uid());

-- Tasks: authenticated users can read open tasks or tasks related to themselves
create policy tasks_read on public.tasks
for select using (
  auth.role() = 'authenticated' and (
    status = 'open' or created_by = auth.uid() or claimed_by = auth.uid() or assigned_to = auth.uid()
  )
);

-- CSR/Admin can insert tasks; allow via profile role check using jwt
create policy tasks_insert on public.tasks
for insert with check (
  auth.role() = 'authenticated' and (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('csr','admin')))
);

-- Workers can update their own assigned/claimed tasks to completed via RPC only; block direct updates
create policy tasks_update_owner on public.tasks
for update using (false) with check (false);

-- Claims: workers can insert and read their own claims
create policy claims_select on public.claims
for select using (auth.role() = 'authenticated' and claimer_id = auth.uid());
create policy claims_insert on public.claims
for insert with check (auth.role() = 'authenticated' and claimer_id = auth.uid());

-- Transactions: workers can read ones attached to themselves; CSR/Admin can read all
create policy transactions_select on public.transactions
for select using (
  auth.role() = 'authenticated' and (
    worker_id = auth.uid() or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('csr','admin'))
  )
);

-- RPC: Claiming tasks fairly under high concurrency
create or replace function public.claim_task(p_task_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare t public.tasks%rowtype; recent_claims int;
begin
  -- Rate limit: max 3 claims per second
  select count(*) into recent_claims from public.claims
   where claimer_id = auth.uid() and claimed_at > now() - interval '1 second';
  if recent_claims >= 3 then
    return json_build_object('status','error','reason','rate_limited');
  end if;

  -- Atomic claim: only succeeds if currently open and not expired
  update public.tasks
     set status = 'claimed', claimed_by = auth.uid(), claimed_at = now(), updated_at = now()
   where id = p_task_id and status = 'open' and (expires_at is null or expires_at > now())
   returning * into t;
  if not found then
    return json_build_object('status','error','reason','unavailable');
  end if;

  -- Record claim
  insert into public.claims(task_id, claimer_id, status, claimed_at)
  values (p_task_id, auth.uid(), 'claimed', now());

  insert into public.audit_logs(user_id, action, entity, entity_id, meta)
  values (auth.uid(),'claim','tasks',p_task_id, json_build_object('status','claimed'));

  return json_build_object('status','success','task_id',t.id);
end;$$;

-- RPC: Complete task and create transaction, then update reputation
create or replace function public.complete_task(p_task_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare t public.tasks%rowtype; uid uuid := auth.uid();
begin
  -- Allow only claimed_by/assigned_to to complete
  update public.tasks
     set status = 'completed', completed_at = now(), updated_at = now()
   where id = p_task_id and (claimed_by = uid or assigned_to = uid) and status in ('claimed','assigned')
   returning * into t;
  if not found then
    return json_build_object('status','error','reason','forbidden_or_invalid');
  end if;

  -- Create transaction
  insert into public.transactions(task_id, worker_id, amount, status)
  values (t.id, coalesce(t.assigned_to, t.claimed_by), t.reward, 'pending');

  -- Reputation recalculation
  perform public.recalculate_reputation(coalesce(t.assigned_to, t.claimed_by));

  insert into public.audit_logs(user_id, action, entity, entity_id, meta)
  values (uid,'complete','tasks',t.id, json_build_object('amount',t.reward));

  return json_build_object('status','success','task_id',t.id);
end;$$;

-- Reputation formula
create or replace function public.recalculate_reputation(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare total int; done int; cancelled int; score numeric;
begin
  select count(*) into total from public.claims where claimer_id = p_user;
  select count(*) into done from public.tasks where (claimed_by = p_user or assigned_to = p_user) and status = 'completed';
  select count(*) into cancelled from public.tasks where (claimed_by = p_user or assigned_to = p_user) and status = 'cancelled';
  score := greatest(0, least(100, 50 + (done * 3) - (cancelled * 5) - (greatest(0,total-done-cancelled))));
  update public.profiles set reputation = score where id = p_user;
end;$$;

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create trigger tasks_set_updated
before update on public.tasks for each row execute procedure public.set_updated_at();

-- Storage bucket for proofs (manual once)
insert into storage.buckets(id, name, public)
values ('proofs','proofs',false)
on conflict (id) do nothing;