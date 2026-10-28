create type public.app_role as enum ('super_admin','institution_admin','coordinator','student','industry_supervisor','institution_supervisor','org_admin');
create type public.inst_status as enum ('pending','approved','suspended');
create type public.placement_status as enum ('pending','approved','rejected');
create type public.log_status as enum ('submitted','approved','needs_correction');

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'University',
  state text not null default '',
  email text not null default '',
  status public.inst_status not null default 'pending',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  institution_id uuid references public.institutions(id) on delete set null,
  matric_no text not null default '',
  department text not null default '',
  level text not null default '',
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null default '',
  state text not null default '',
  address text not null default '',
  email text not null default '',
  slots int not null default 5,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_title text not null default '',
  start_date date not null,
  end_date date not null,
  status public.placement_status not null default 'pending',
  reviewer_note text not null default '',
  industry_supervisor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.logbook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  entry_date date not null default current_date,
  week_number int not null default 1,
  activities text not null,
  skills text not null default '',
  status public.log_status not null default 'submitted',
  supervisor_comment text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.institutions to anon;
grant select, insert, update, delete on public.institutions, public.profiles, public.organizations, public.placements, public.logbook_entries to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.institutions, public.profiles, public.user_roles, public.organizations, public.placements, public.logbook_entries to service_role;

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.placements enable row level security;
alter table public.logbook_entries enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.my_institution()
returns uuid language sql stable security definer set search_path = public as $$
  select institution_id from public.profiles where id = auth.uid()
$$;

-- staff of an approved institution (admin or coordinator)
create or replace function public.is_inst_staff(_inst uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _inst is not null
    and _inst = (select institution_id from public.profiles where id = auth.uid())
    and exists (select 1 from public.institutions where id = _inst and status = 'approved')
    and (public.has_role(auth.uid(),'institution_admin') or public.has_role(auth.uid(),'coordinator'))
$$;

create or replace function public.supervises(_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.placements where student_id = _student and industry_supervisor_id = auth.uid())
$$;

-- institutions
create policy "public reads approved institutions" on public.institutions for select to anon, authenticated using (status = 'approved');
create policy "creator reads own institution" on public.institutions for select to authenticated using (created_by = auth.uid());
create policy "super admin reads all institutions" on public.institutions for select to authenticated using (public.has_role(auth.uid(),'super_admin'));
create policy "institution admin registers" on public.institutions for insert to authenticated with check (created_by = auth.uid() and status = 'pending' and public.has_role(auth.uid(),'institution_admin'));
create policy "super admin updates institutions" on public.institutions for update to authenticated using (public.has_role(auth.uid(),'super_admin'));

-- profiles
create policy "self read profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "self update profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff read institution profiles" on public.profiles for select to authenticated using (public.is_inst_staff(institution_id));
create policy "supervisor reads assigned students" on public.profiles for select to authenticated using (public.supervises(id));
create policy "super admin reads profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'super_admin'));

-- roles
create policy "self read roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- organizations
create policy "signed in read orgs" on public.organizations for select to authenticated using (true);
create policy "org admins and staff add orgs" on public.organizations for insert to authenticated with check (created_by = auth.uid() and (public.has_role(auth.uid(),'org_admin') or public.has_role(auth.uid(),'institution_admin') or public.has_role(auth.uid(),'super_admin')));
create policy "creator updates org" on public.organizations for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "creator deletes org" on public.organizations for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(),'super_admin'));

-- placements
create policy "student reads own placements" on public.placements for select to authenticated using (student_id = auth.uid());
create policy "student applies" on public.placements for insert to authenticated with check (student_id = auth.uid() and status = 'pending' and industry_supervisor_id is null and institution_id = public.my_institution() and public.has_role(auth.uid(),'student'));
create policy "student withdraws pending" on public.placements for delete to authenticated using (student_id = auth.uid() and status = 'pending');
create policy "staff read placements" on public.placements for select to authenticated using (public.is_inst_staff(institution_id));
create policy "staff review placements" on public.placements for update to authenticated using (public.is_inst_staff(institution_id)) with check (public.is_inst_staff(institution_id));
create policy "supervisor reads assigned placements" on public.placements for select to authenticated using (industry_supervisor_id = auth.uid());
create policy "super admin reads placements" on public.placements for select to authenticated using (public.has_role(auth.uid(),'super_admin'));

-- logbook
create policy "student reads own log" on public.logbook_entries for select to authenticated using (student_id = auth.uid());
create policy "student writes log" on public.logbook_entries for insert to authenticated with check (student_id = auth.uid() and status = 'submitted' and exists (select 1 from public.placements p where p.id = placement_id and p.student_id = auth.uid() and p.status = 'approved'));
create policy "student edits unapproved log" on public.logbook_entries for update to authenticated using (student_id = auth.uid() and status <> 'approved') with check (student_id = auth.uid() and status = 'submitted');
create policy "student deletes unapproved log" on public.logbook_entries for delete to authenticated using (student_id = auth.uid() and status <> 'approved');
create policy "supervisor reads log" on public.logbook_entries for select to authenticated using (exists (select 1 from public.placements p where p.id = placement_id and p.industry_supervisor_id = auth.uid()));
create policy "supervisor reviews log" on public.logbook_entries for update to authenticated using (exists (select 1 from public.placements p where p.id = placement_id and p.industry_supervisor_id = auth.uid()));
create policy "staff read log" on public.logbook_entries for select to authenticated using (exists (select 1 from public.placements p where p.id = placement_id and public.is_inst_staff(p.institution_id)));

-- signup: profile + self-service role (never super_admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
begin
  if r not in ('student','institution_admin','industry_supervisor','org_admin') then r := 'student'; end if;
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), coalesce(new.email,''));
  insert into public.user_roles (user_id, role) values (new.id, r::public.app_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- link institution creator
create or replace function public.link_institution_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set institution_id = new.id where id = new.created_by;
  return new;
end $$;
create trigger on_institution_created after insert on public.institutions for each row execute function public.link_institution_creator();

-- staff cannot reassign students' protected fields; supervisor only comment/status
create or replace function public.guard_log_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.student_id <> auth.uid() then
    new.activities := old.activities; new.skills := old.skills; new.entry_date := old.entry_date;
    new.week_number := old.week_number; new.student_id := old.student_id; new.placement_id := old.placement_id;
    new.reviewed_at := now();
  end if;
  return new;
end $$;
create trigger guard_log_review before update on public.logbook_entries for each row execute function public.guard_log_review();

-- assign industry supervisor by email
create or replace function public.assign_supervisor(_placement uuid, _email text)
returns void language plpgsql security definer set search_path = public as $$
declare sup uuid; inst uuid;
begin
  select institution_id into inst from public.placements where id = _placement;
  if not public.is_inst_staff(inst) then raise exception 'Not allowed'; end if;
  select p.id into sup from public.profiles p join public.user_roles r on r.user_id = p.id and r.role = 'industry_supervisor' where lower(p.email) = lower(_email) limit 1;
  if sup is null then raise exception 'No industrial supervisor account with that email'; end if;
  update public.placements set industry_supervisor_id = sup where id = _placement;
end $$;
grant execute on function public.assign_supervisor(uuid, text) to authenticated;

-- national stats for anyone (aggregate only)
create or replace function public.public_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'institutions', (select count(*) from public.institutions where status='approved'),
    'students', (select count(*) from public.user_roles where role='student'),
    'organizations', (select count(*) from public.organizations),
    'placements', (select count(*) from public.placements where status='approved'))
$$;
grant execute on function public.public_stats() to anon, authenticated;

insert into public.institutions (name, type, state, email, status) values
('University of Lagos','University','Lagos','siwes@unilag.edu.ng','approved'),
('Ahmadu Bello University','University','Kaduna','siwes@abu.edu.ng','approved'),
('Yaba College of Technology','Polytechnic','Lagos','siwes@yabatech.edu.ng','approved'),
('Federal College of Education, Kano','College of Education','Kano','siwes@fcekano.edu.ng','approved');

insert into public.organizations (name, sector, state, address, email, slots) values
('Dangote Cement Plc','Manufacturing','Ogun','Ibese Plant, Ogun State','careers@dangote.com',12),
('Nigerian National Petroleum Company','Oil & Gas','Abuja','NNPC Towers, Central Business District','it@nnpc.gov.ng',20),
('MTN Nigeria','Telecommunications','Lagos','Golden Plaza, Falomo, Ikoyi','interns@mtn.ng',15),
('Julius Berger Nigeria','Construction','Abuja','Utako District, Abuja','training@julius-berger.com',10),
('Federal Ministry of Health','Public Health','Abuja','Federal Secretariat, Abuja','hr@health.gov.ng',8),
('Flutterwave','Fintech','Lagos','Lekki Phase 1, Lagos','talent@flutterwave.com',6);