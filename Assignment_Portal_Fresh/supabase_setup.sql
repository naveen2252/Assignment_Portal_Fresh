-- Run in the NEW Supabase project's SQL Editor.
-- IMPORTANT: Replace 00000000-0000-0000-0000-000000000000 with your NEW Auth admin UID before running.
create table if not exists public.portal_settings (
 id integer primary key default 1 check (id=1),
 deadline_at timestamptz
);
insert into public.portal_settings(id,deadline_at) values(1,null) on conflict(id) do nothing;

create table if not exists public.submissions (
 id uuid primary key default gen_random_uuid(),
 username text not null check(length(btrim(username)) between 1 and 100),
 sap_id text not null check(length(btrim(sap_id)) between 1 and 50),
 assignment_title text not null check(length(btrim(assignment_title)) between 1 and 150),
 file_path text not null unique,
 file_name text not null,
 file_size bigint not null check(file_size between 1 and 10485760),
 created_at timestamptz not null default now()
);

-- SECURITY DEFINER avoids storage schema cross-schema permission problems.
create or replace function public.submission_is_open()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.portal_settings where id=1 and deadline_at > now());
$$;
revoke all on function public.submission_is_open() from public;
grant execute on function public.submission_is_open() to anon, authenticated;

create or replace function public.is_portal_admin()
returns boolean language sql stable set search_path = '' as $$
 select (select auth.uid()) = '00000000-0000-0000-0000-000000000000'::uuid;
$$;
grant execute on function public.is_portal_admin() to anon, authenticated;

alter table public.portal_settings enable row level security;
alter table public.submissions enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.portal_settings to anon, authenticated;
grant update(deadline_at) on public.portal_settings to authenticated;
grant insert on public.submissions to anon;
grant select, delete on public.submissions to authenticated;

drop policy if exists "settings read" on public.portal_settings;
create policy "settings read" on public.portal_settings for select to anon, authenticated using (true);
drop policy if exists "admin update deadline" on public.portal_settings;
create policy "admin update deadline" on public.portal_settings for update to authenticated using ((select public.is_portal_admin())) with check ((select public.is_portal_admin()));

drop policy if exists "student submit while open" on public.submissions;
create policy "student submit while open" on public.submissions for insert to anon with check (
 public.submission_is_open() and file_path like 'student/%' and file_path not like '%..%'
);
drop policy if exists "admin view submissions" on public.submissions;
create policy "admin view submissions" on public.submissions for select to authenticated using ((select public.is_portal_admin()));
drop policy if exists "admin delete submissions" on public.submissions;
create policy "admin delete submissions" on public.submissions for delete to authenticated using ((select public.is_portal_admin()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('assignments','assignments',false,10485760,array[
 'application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/octet-stream'
])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "student upload while open" on storage.objects;
create policy "student upload while open" on storage.objects for insert to anon
with check(bucket_id='assignments' and (storage.foldername(name))[1]='student' and public.submission_is_open());
drop policy if exists "admin read files" on storage.objects;
create policy "admin read files" on storage.objects for select to authenticated
using(bucket_id='assignments' and (select public.is_portal_admin()));
drop policy if exists "admin delete files" on storage.objects;
create policy "admin delete files" on storage.objects for delete to authenticated
using(bucket_id='assignments' and (select public.is_portal_admin()));

-- After running, set deadline through admin dashboard (initially NULL/closed).
select id,deadline_at from public.portal_settings;
