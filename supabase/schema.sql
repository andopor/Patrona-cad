-- Applied to vljpxoixyyvlvuhinqwv. No service-role key is used by Patrona CAD.
create table public.patrona_snapshots (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 project_id text not null check (length(project_id) between 1 and 100),
 name text not null check (length(name) <= 200),
 created_at timestamptz not null default now(),
 content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16777216),
 constraint patrona_snapshot_content unique (user_id, project_id, content_hash)
);
alter table public.patrona_snapshots enable row level security;
revoke all on public.patrona_snapshots from anon, authenticated;
grant select, insert on public.patrona_snapshots to authenticated;
create policy patrona_read_own on public.patrona_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy patrona_insert_own on public.patrona_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
create index patrona_snapshots_owner_date on public.patrona_snapshots (user_id, created_at desc);
comment on table public.patrona_snapshots is 'Patrona CAD: immutable private project backups. Local originals preserved.';
