-- Run this once in the Supabase SQL editor if the app is already set up.
-- New projects can run schema.sql instead; this file is only for existing databases.

create table if not exists public.group_laws (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists group_laws_group_idx on public.group_laws (group_id, created_at);

create or replace function public.add_law(p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
  lid uuid;
begin
  gid := public.current_group_id();
  if gid is null then raise exception 'no_group'; end if;
  cleaned := nullif(trim(coalesce(p_body, '')), '');
  if cleaned is null or char_length(cleaned) > 1000 then raise exception 'bad_law'; end if;
  insert into public.group_laws (group_id, body) values (gid, cleaned) returning id into lid;
  perform public.write_activity(gid, 'law.added', 'group_law', lid, replace(cleaned, '|', '/'));
  return lid;
end;
$$;

create or replace function public.update_law(p_law_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
begin
  gid := public.current_group_id();
  if gid is null then raise exception 'no_group'; end if;
  cleaned := nullif(trim(coalesce(p_body, '')), '');
  if cleaned is null or char_length(cleaned) > 1000 then raise exception 'bad_law'; end if;
  update public.group_laws set body = cleaned where id = p_law_id and group_id = gid;
  if not found then raise exception 'law_not_found'; end if;
  perform public.write_activity(gid, 'law.updated', 'group_law', p_law_id, replace(cleaned, '|', '/'));
end;
$$;

create or replace function public.delete_law(p_law_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  old_body text;
begin
  gid := public.current_group_id();
  if gid is null then raise exception 'no_group'; end if;
  select body into old_body from public.group_laws where id = p_law_id and group_id = gid;
  if old_body is null then raise exception 'law_not_found'; end if;
  delete from public.group_laws where id = p_law_id and group_id = gid;
  perform public.write_activity(gid, 'law.deleted', 'group_law', p_law_id, replace(old_body, '|', '/'));
end;
$$;

alter table public.group_laws enable row level security;

drop policy if exists group_laws_select on public.group_laws;
create policy group_laws_select on public.group_laws
  for select to authenticated
  using (group_id = public.current_group_id());

grant select on public.group_laws to authenticated;
grant execute on function public.add_law(text) to authenticated;
grant execute on function public.update_law(uuid, text) to authenticated;
grant execute on function public.delete_law(uuid) to authenticated;
