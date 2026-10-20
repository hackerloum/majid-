-- Run once in the Supabase SQL editor. Adds member logins and an invite code per group.

alter table public.groups add column if not exists invite_code text;
update public.groups
set invite_code = upper(substr(md5(random()::text || id::text), 1, 8))
where invite_code is null;
create unique index if not exists groups_invite_code_key on public.groups (invite_code);
alter table public.groups alter column invite_code set default upper(substr(md5(random()::text), 1, 8));
alter table public.groups alter column invite_code set not null;

alter table public.members add column if not exists user_id uuid unique references auth.users (id) on delete set null;

create or replace function public.current_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from public.groups where owner_id = auth.uid()),
    (select group_id from public.members where user_id = auth.uid() limit 1)
  )
$$;

create or replace function public.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  select id into gid from public.groups where owner_id = auth.uid();
  if gid is null then raise exception 'not_admin'; end if;
  return gid;
end;
$$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.members where user_id = auth.uid() limit 1
$$;

create or replace function public.link_member_account(p_user uuid, p_code text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
  existing uuid;
begin
  cleaned := nullif(trim(coalesce(p_name, '')), '');
  if cleaned is null or char_length(cleaned) > 120 then raise exception 'bad_name'; end if;
  select id into gid
  from public.groups
  where invite_code = upper(trim(coalesce(p_code, '')));
  if gid is null then raise exception 'bad_invite'; end if;

  select id into existing
  from public.members
  where group_id = gid
    and user_id is null
    and lower(full_name) = lower(cleaned)
  order by created_at
  limit 1;

  if existing is not null then
    update public.members set user_id = p_user, is_active = true where id = existing;
  else
    insert into public.members (group_id, user_id, full_name)
    values (gid, p_user, cleaned);
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gname text;
  role text;
begin
  role := coalesce(new.raw_user_meta_data ->> 'role', 'admin');
  if role = 'member' then
    perform public.link_member_account(
      new.id,
      new.raw_user_meta_data ->> 'invite_code',
      new.raw_user_meta_data ->> 'full_name'
    );
    return new;
  end if;
  gname := nullif(trim(coalesce(new.raw_user_meta_data ->> 'group_name', '')), '');
  if gname is null then
    gname := 'Kikundi changu';
  end if;
  insert into public.groups (owner_id, name) values (new.id, left(gname, 80));
  return new;
end;
$$;

create or replace function public.rename_group(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
begin
  gid := public.require_admin();
  cleaned := nullif(trim(coalesce(p_name, '')), '');
  if cleaned is null or char_length(cleaned) > 80 then raise exception 'bad_name'; end if;
  update public.groups set name = cleaned where id = gid;
  perform public.write_activity(gid, 'group.renamed', 'group', gid, replace(cleaned, '|', '/'));
end;
$$;

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (id = public.current_group_id());

drop policy if exists members_select on public.members;
create policy members_select on public.members
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = members.group_id and g.owner_id = auth.uid())
      or user_id = auth.uid()
    )
  );

drop policy if exists contributions_select on public.contributions;
create policy contributions_select on public.contributions
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = contributions.group_id and g.owner_id = auth.uid())
      or member_id = public.current_member_id()
    )
  );

drop policy if exists loans_select on public.loans;
create policy loans_select on public.loans
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = loans.group_id and g.owner_id = auth.uid())
      or member_id = public.current_member_id()
    )
  );

drop policy if exists repayments_select on public.repayments;
create policy repayments_select on public.repayments
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = repayments.group_id and g.owner_id = auth.uid())
      or member_id = public.current_member_id()
    )
  );

drop policy if exists fines_select on public.fines;
create policy fines_select on public.fines
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = fines.group_id and g.owner_id = auth.uid())
      or member_id = public.current_member_id()
    )
  );

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and (
      exists (select 1 from public.groups g where g.id = transactions.group_id and g.owner_id = auth.uid())
      or member_id = public.current_member_id()
    )
  );

drop policy if exists activity_select on public.activity_logs;
create policy activity_select on public.activity_logs
  for select to authenticated
  using (
    group_id = public.current_group_id()
    and exists (select 1 from public.groups g where g.id = activity_logs.group_id and g.owner_id = auth.uid())
  );

grant execute on function public.current_group_id() to authenticated;
grant execute on function public.current_member_id() to authenticated;
revoke all on function public.require_admin() from public, anon, authenticated;
revoke all on function public.link_member_account(uuid, text, text) from public, anon, authenticated;

-- Recreate write functions so only the group admin can change money and laws.

create or replace function public.rename_group(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
begin
  gid := public.require_admin();
  cleaned := nullif(trim(coalesce(p_name, '')), '');
  if cleaned is null or char_length(cleaned) > 80 then raise exception 'bad_name'; end if;
  update public.groups set name = cleaned where id = gid;
  perform public.write_activity(gid, 'group.renamed', 'group', gid, replace(cleaned, '|', '/'));
end;
$$;

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
  gid := public.require_admin();
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
  gid := public.require_admin();
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
  gid := public.require_admin();
  select body into old_body from public.group_laws where id = p_law_id and group_id = gid;
  if old_body is null then raise exception 'law_not_found'; end if;
  delete from public.group_laws where id = p_law_id and group_id = gid;
  perform public.write_activity(gid, 'law.deleted', 'group_law', p_law_id, replace(old_body, '|', '/'));
end;
$$;

create or replace function public.add_member(p_name text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
  phone text;
  mid uuid;
begin
  gid := public.require_admin();
  cleaned := nullif(trim(coalesce(p_name, '')), '');
  if cleaned is null or char_length(cleaned) > 120 then raise exception 'bad_name'; end if;
  phone := nullif(trim(coalesce(p_phone, '')), '');
  insert into public.members (group_id, full_name, phone)
  values (gid, cleaned, phone)
  returning id into mid;
  perform public.write_activity(gid, 'member.added', 'member', mid, replace(cleaned, '|', '/'));
  return mid;
end;
$$;

create or replace function public.update_member(
  p_member_id uuid,
  p_name text,
  p_phone text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cleaned text;
  phone text;
  was_active boolean;
  action_name text;
begin
  gid := public.require_admin();
  cleaned := nullif(trim(coalesce(p_name, '')), '');
  if cleaned is null or char_length(cleaned) > 120 then raise exception 'bad_name'; end if;
  phone := nullif(trim(coalesce(p_phone, '')), '');

  select is_active into was_active
  from public.members
  where id = p_member_id and group_id = gid;
  if was_active is null then raise exception 'member_not_found'; end if;

  update public.members
  set full_name = cleaned, phone = phone, is_active = coalesce(p_is_active, was_active)
  where id = p_member_id;

  if was_active and coalesce(p_is_active, was_active) = false then
    action_name := 'member.deactivated';
  elsif was_active = false and coalesce(p_is_active, was_active) = true then
    action_name := 'member.activated';
  else
    action_name := 'member.updated';
  end if;

  perform public.write_activity(gid, action_name, 'member', p_member_id, replace(cleaned, '|', '/'));
end;
$$;

create or replace function public.record_contribution(
  p_member_id uuid,
  p_amount bigint,
  p_paid_on date,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  member_name text;
  note text;
  cid uuid;
begin
  gid := public.require_admin();
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then raise exception 'bad_amount'; end if;
  if p_paid_on is null then raise exception 'bad_date'; end if;
  note := nullif(trim(coalesce(p_note, '')), '');

  select full_name into member_name
  from public.members
  where id = p_member_id and group_id = gid;
  if member_name is null then raise exception 'member_not_found'; end if;

  insert into public.contributions (group_id, member_id, amount, paid_on, note, created_by)
  values (gid, p_member_id, p_amount, p_paid_on, note, auth.uid())
  returning id into cid;

  insert into public.transactions (group_id, member_id, kind, amount, source_table, source_id, occurred_on, note, created_by)
  values (gid, p_member_id, 'contribution', p_amount, 'contributions', cid, p_paid_on, note, auth.uid());

  perform public.write_activity(
    gid, 'contribution.recorded', 'contribution', cid,
    replace(member_name, '|', '/') || '|' || p_amount::text
  );
  return cid;
end;
$$;

create or replace function public.give_loan(
  p_member_id uuid,
  p_principal bigint,
  p_interest_percent numeric,
  p_issued_on date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  member_name text;
  active boolean;
  rate numeric(5, 2);
  interest bigint;
  total_due bigint;
  lid uuid;
begin
  gid := public.require_admin();
  if p_principal is null or p_principal <= 0 or p_principal > 1000000000 then raise exception 'bad_amount'; end if;
  if p_issued_on is null then raise exception 'bad_date'; end if;
  if p_interest_percent is null or p_interest_percent < 0 or p_interest_percent > 100 then
    raise exception 'bad_percent';
  end if;

  select full_name, is_active into member_name, active
  from public.members
  where id = p_member_id and group_id = gid;
  if member_name is null then raise exception 'member_not_found'; end if;
  if active = false then raise exception 'member_inactive'; end if;

  rate := round(p_interest_percent, 2);
  interest := round(p_principal * rate / 100.0)::bigint;
  total_due := p_principal + interest;

  insert into public.loans (
    group_id, member_id, principal, interest_percent, interest_amount, total_due, issued_on, created_by
  ) values (
    gid, p_member_id, p_principal, rate, interest, total_due, p_issued_on, auth.uid()
  ) returning id into lid;

  insert into public.transactions (group_id, member_id, kind, amount, source_table, source_id, occurred_on, created_by)
  values (gid, p_member_id, 'loan_out', p_principal, 'loans', lid, p_issued_on, auth.uid());

  perform public.write_activity(
    gid, 'loan.given', 'loan', lid,
    replace(member_name, '|', '/') || '|' || p_principal::text || '|' || total_due::text
  );
  return lid;
end;
$$;

create or replace function public.record_repayment(
  p_loan_id uuid,
  p_amount bigint,
  p_paid_on date,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  loan public.loans%rowtype;
  member_name text;
  already bigint;
  balance bigint;
  note text;
  rid uuid;
begin
  gid := public.require_admin();
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then raise exception 'bad_amount'; end if;
  if p_paid_on is null then raise exception 'bad_date'; end if;
  note := nullif(trim(coalesce(p_note, '')), '');

  select * into loan from public.loans where id = p_loan_id and group_id = gid;
  if loan.id is null then raise exception 'loan_not_found'; end if;
  if loan.status <> 'active' then raise exception 'loan_closed'; end if;

  select full_name into member_name from public.members where id = loan.member_id;
  select coalesce(sum(amount), 0) into already from public.repayments where loan_id = loan.id;
  balance := loan.total_due - already;
  if p_amount > balance then raise exception 'overpay'; end if;

  insert into public.repayments (group_id, loan_id, member_id, amount, paid_on, note, created_by)
  values (gid, loan.id, loan.member_id, p_amount, p_paid_on, note, auth.uid())
  returning id into rid;

  insert into public.transactions (group_id, member_id, kind, amount, source_table, source_id, occurred_on, note, created_by)
  values (gid, loan.member_id, 'repayment', p_amount, 'repayments', rid, p_paid_on, note, auth.uid());

  if p_amount = balance then
    update public.loans set status = 'paid' where id = loan.id;
  end if;

  perform public.write_activity(
    gid, 'repayment.recorded', 'repayment', rid,
    replace(member_name, '|', '/') || '|' || p_amount::text || '|' || (balance - p_amount)::text
  );
  return rid;
end;
$$;

create or replace function public.add_fine(
  p_member_id uuid,
  p_amount bigint,
  p_reason text,
  p_fined_on date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  member_name text;
  reason text;
  fid uuid;
begin
  gid := public.require_admin();
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then raise exception 'bad_amount'; end if;
  if p_fined_on is null then raise exception 'bad_date'; end if;
  reason := nullif(trim(coalesce(p_reason, '')), '');
  if reason is null or char_length(reason) > 200 then raise exception 'reason_required'; end if;

  select full_name into member_name
  from public.members
  where id = p_member_id and group_id = gid;
  if member_name is null then raise exception 'member_not_found'; end if;

  insert into public.fines (group_id, member_id, amount, reason, fined_on, created_by)
  values (gid, p_member_id, p_amount, reason, p_fined_on, auth.uid())
  returning id into fid;

  insert into public.transactions (group_id, member_id, kind, amount, source_table, source_id, occurred_on, note, created_by)
  values (gid, p_member_id, 'fine', p_amount, 'fines', fid, p_fined_on, reason, auth.uid());

  perform public.write_activity(
    gid, 'fine.added', 'fine', fid,
    replace(member_name, '|', '/') || '|' || p_amount::text || '|' || replace(reason, '|', '/')
  );
  return fid;
end;
$$;

-- Profit for the open cycle = interest collected after the last share-out + fines.
-- Each member gets their contributions back, plus profit in proportion to contributions.
-- Leftover shillings from rounding go to the member who saved the most.
create or replace function public.shareout_preview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  gid uuid;
  started timestamptz;
  v_interest bigint := 0;
  v_fines bigint := 0;
  v_profit bigint := 0;
  v_contrib bigint := 0;
  v_outstanding bigint := 0;
  v_left bigint := 0;
  v_share bigint := 0;
  rec record;
  lines jsonb := '[]'::jsonb;
begin
  gid := public.require_admin();

  started := public.cycle_start(gid);
  v_interest := public.interest_collected(gid, started);

  select coalesce(sum(amount), 0) into v_fines
  from public.fines
  where group_id = gid and created_at > started;

  v_profit := v_interest + v_fines;

  select coalesce(sum(l.total_due - coalesce(p.paid, 0)), 0) into v_outstanding
  from public.loans l
  left join (
    select loan_id, sum(amount)::bigint as paid
    from public.repayments
    where group_id = gid
    group by loan_id
  ) p on p.loan_id = l.id
  where l.group_id = gid and l.status = 'active';

  select coalesce(sum(amount), 0) into v_contrib
  from public.contributions
  where group_id = gid and created_at > started;

  v_left := v_profit;

  for rec in
    select m.id as member_id, m.full_name, sum(c.amount)::bigint as contribution
    from public.members m
    join public.contributions c on c.member_id = m.id
    where m.group_id = gid
      and c.group_id = gid
      and c.created_at > started
    group by m.id, m.full_name
    having sum(c.amount) > 0
    order by sum(c.amount) desc, m.full_name asc, m.id asc
  loop
    if v_contrib = 0 then
      v_share := 0;
    else
      v_share := (rec.contribution * v_profit) / v_contrib;
    end if;
    v_left := v_left - v_share;
    lines := lines || jsonb_build_array(jsonb_build_object(
      'member_id', rec.member_id,
      'full_name', rec.full_name,
      'contribution', rec.contribution,
      'profit_share', v_share,
      'payout', rec.contribution + v_share
    ));
  end loop;

  if v_left <> 0 and jsonb_array_length(lines) > 0 then
    lines := jsonb_set(
      lines,
      '{0,profit_share}',
      to_jsonb((lines -> 0 ->> 'profit_share')::bigint + v_left)
    );
    lines := jsonb_set(
      lines,
      '{0,payout}',
      to_jsonb((lines -> 0 ->> 'payout')::bigint + v_left)
    );
  end if;

  return jsonb_build_object(
    'interest_collected', v_interest,
    'fines_total', v_fines,
    'profit', v_profit,
    'contributions_total', v_contrib,
    'outstanding_loans', v_outstanding,
    'lines', lines
  );
end;
$$;

create or replace function public.confirm_shareout()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  preview jsonb;
  line jsonb;
  batch uuid := gen_random_uuid();
  count_lines int := 0;
  total_payout bigint := 0;
  payout bigint;
begin
  gid := public.require_admin();

  perform 1 from public.groups where id = gid for update;

  preview := public.shareout_preview();
  if jsonb_array_length(preview -> 'lines') = 0 then
    raise exception 'nothing_to_share';
  end if;

  for line in select value from jsonb_array_elements(preview -> 'lines')
  loop
    payout := (line ->> 'payout')::bigint;
    if payout <= 0 then continue; end if;
    insert into public.transactions (
      group_id, member_id, kind, amount, source_table, source_id, occurred_on, created_by
    ) values (
      gid,
      (line ->> 'member_id')::uuid,
      'shareout',
      payout,
      'shareout',
      batch,
      (now() at time zone 'Africa/Dar_es_Salaam')::date,
      auth.uid()
    );
    count_lines := count_lines + 1;
    total_payout := total_payout + payout;
  end loop;

  perform public.write_activity(
    gid,
    'shareout.confirmed',
    'shareout',
    batch,
    total_payout::text || '|' || count_lines::text
  );
end;
$$;

create or replace function public.group_snapshot(p_month date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  gid uuid;
  month_start date;
  month_end date;
  result jsonb;
begin
  gid := public.require_admin();
  if p_month is null then
    p_month := (now() at time zone 'Africa/Dar_es_Salaam')::date;
  end if;
  month_start := date_trunc('month', p_month)::date;
  month_end := (month_start + interval '1 month')::date;

  select jsonb_build_object(
    'members_active', (select count(*) from public.members where group_id = gid and is_active),
    'members_all', (select count(*) from public.members where group_id = gid),
    'contributions_total', (select coalesce(sum(amount), 0) from public.contributions where group_id = gid),
    'fines_total', (select coalesce(sum(amount), 0) from public.fines where group_id = gid),
    'loans_principal', (select coalesce(sum(principal), 0) from public.loans where group_id = gid),
    'loans_interest', (select coalesce(sum(interest_amount), 0) from public.loans where group_id = gid),
    'repayments_total', (select coalesce(sum(amount), 0) from public.repayments where group_id = gid),
    'outstanding', (
      select coalesce(sum(l.total_due - coalesce(p.paid, 0)), 0)
      from public.loans l
      left join (
        select loan_id, sum(amount)::bigint as paid
        from public.repayments
        where group_id = gid
        group by loan_id
      ) p on p.loan_id = l.id
      where l.group_id = gid and l.status = 'active'
    ),
    'interest_collected', public.interest_collected(gid, '-infinity'::timestamptz),
    'unpaid', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'full_name', m.full_name) order by m.full_name)
      from public.members m
      where m.group_id = gid
        and m.is_active
        and not exists (
          select 1 from public.contributions c
          where c.member_id = m.id
            and c.paid_on >= month_start
            and c.paid_on < month_end
        )
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;
