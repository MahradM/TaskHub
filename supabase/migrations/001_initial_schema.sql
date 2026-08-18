-- TaskHub initial schema. Run in the Supabase SQL editor or with `supabase db push`.
create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'rejected', 'expired');
create type public.project_status as enum ('active', 'archived');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 32),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]+$')
);
create unique index profiles_email_unique_idx on public.profiles (lower(email));
create unique index profiles_username_unique_idx on public.profiles (lower(username));

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 500),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workspaces_owner_idx on public.workspaces(owner_id);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);
create index workspace_members_workspace_role_idx on public.workspace_members(workspace_id, role);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  invited_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint invitation_target_required check (invited_user_id is not null or invited_email is not null)
);
create unique index invitations_pending_user_idx on public.workspace_invitations(workspace_id, invited_user_id) where status = 'pending' and invited_user_id is not null;
create unique index invitations_pending_email_idx on public.workspace_invitations(workspace_id, lower(invited_email)) where status = 'pending' and invited_email is not null;
create index invitations_lookup_idx on public.workspace_invitations(invited_user_id, status, expires_at);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text check (char_length(description) <= 1000),
  status public.project_status not null default 'active',
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_workspace_status_idx on public.projects(workspace_id, status);
create index projects_updated_idx on public.projects(workspace_id, updated_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text check (char_length(description) <= 3000),
  due_date timestamptz,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  assignee_user_id uuid references public.profiles(id) on delete set null,
  assigned_to_workspace boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_assignment_exclusive check (not (assigned_to_workspace and assignee_user_id is not null))
);
create index tasks_workspace_status_idx on public.tasks(workspace_id, status);
create index tasks_project_idx on public.tasks(project_id);
create index tasks_assignee_status_idx on public.tasks(assignee_user_id, status);
create index tasks_workspace_due_idx on public.tasks(workspace_id, due_date) where due_date is not null;
create index tasks_priority_idx on public.tasks(workspace_id, priority);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  mime_type text not null,
  created_at timestamptz not null default now()
);
create index files_project_created_idx on public.files(project_id, created_at desc);
create index files_workspace_idx on public.files(workspace_id);

-- SECURITY DEFINER helpers prevent recursive RLS checks. Public execution is revoked.
create or replace function public.is_workspace_member(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = target_user_id)
$$;
create or replace function public.can_manage_workspace(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = target_user_id and role in ('owner','admin'))
$$;
create or replace function public.shares_workspace(target_user_id uuid, viewer_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members a join public.workspace_members b on b.workspace_id = a.workspace_id where a.user_id = target_user_id and b.user_id = viewer_id)
$$;
create or replace function public.has_workspace_invitation(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_invitations i join public.profiles p on p.id=target_user_id where i.workspace_id=target_workspace_id and i.status='pending' and i.expires_at>now() and (i.invited_user_id=target_user_id or lower(i.invited_email)=lower(p.email)))
$$;
revoke all on function public.is_workspace_member(uuid,uuid) from public;
revoke all on function public.can_manage_workspace(uuid,uuid) from public;
revoke all on function public.shares_workspace(uuid,uuid) from public;
revoke all on function public.has_workspace_invitation(uuid,uuid) from public;
grant execute on function public.is_workspace_member(uuid,uuid), public.can_manage_workspace(uuid,uuid), public.shares_workspace(uuid,uuid), public.has_workspace_invitation(uuid,uuid) to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create or replace function public.protect_immutable_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'workspaces' and new.owner_id <> old.owner_id then raise exception 'Workspace ownership cannot be changed'; end if;
  if tg_table_name = 'profiles' and (new.email <> old.email or new.username <> old.username) then raise exception 'Profile identity is managed by authentication'; end if;
  return new;
end $$;
create trigger protect_workspace_owner before update on public.workspaces for each row execute function public.protect_immutable_fields();
create trigger protect_profile_email before update on public.profiles for each row execute function public.protect_immutable_fields();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare generated_username text;
begin
  generated_username := coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1) || '_' || substr(new.id::text,1,6));
  insert into public.profiles(id,email,username,full_name) values(new.id,new.email,generated_username,nullif(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.add_workspace_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.workspace_members(workspace_id,user_id,role) values(new.id,new.owner_id,'owner'); return new; end $$;
create trigger on_workspace_created after insert on public.workspaces for each row execute function public.add_workspace_owner();

create or replace function public.validate_task_relations() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.projects where id = new.project_id and workspace_id = new.workspace_id) then raise exception 'Project does not belong to workspace'; end if;
  if new.assignee_user_id is not null and not exists(select 1 from public.workspace_members where workspace_id = new.workspace_id and user_id = new.assignee_user_id) then raise exception 'Assignee is not a workspace member'; end if;
  return new;
end $$;
create trigger validate_task before insert or update on public.tasks for each row execute function public.validate_task_relations();

create or replace function public.validate_file_relations() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.projects where id = new.project_id and workspace_id = new.workspace_id) then raise exception 'Project does not belong to workspace'; end if;
  if split_part(new.storage_path,'/',1) <> 'projects' or split_part(new.storage_path,'/',2) <> new.project_id::text or split_part(new.storage_path,'/',3) <> new.uploaded_by::text then raise exception 'Invalid storage path'; end if;
  return new;
end $$;
create trigger validate_file before insert or update on public.files for each row execute function public.validate_file_relations();

-- Invitation RPCs keep identity lookup and membership creation on the trusted database side.
create or replace function public.invite_to_workspace(target_workspace_id uuid, identifier text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_profile public.profiles; clean_identifier text := lower(trim(identifier));
begin
  if not public.can_manage_workspace(target_workspace_id, auth.uid()) then raise exception 'Only owners and admins may invite members'; end if;
  select * into target_profile from public.profiles where lower(username)=clean_identifier or lower(email)=clean_identifier limit 1;
  if target_profile.id is null then raise exception 'No TaskHub user matches that email or username'; end if;
  if public.is_workspace_member(target_workspace_id,target_profile.id) then raise exception 'This user is already a member'; end if;
  insert into public.workspace_invitations(workspace_id,invited_user_id,invited_email,invited_by) values(target_workspace_id,target_profile.id,target_profile.email,auth.uid());
end $$;
create or replace function public.respond_to_invitation(invitation_id uuid, accept_invitation boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare invitation public.workspace_invitations;
begin
  select * into invitation from public.workspace_invitations where id=invitation_id for update;
  if invitation.id is null or invitation.status <> 'pending' then raise exception 'Invitation is no longer available'; end if;
  if invitation.expires_at <= now() then update public.workspace_invitations set status='expired' where id=invitation_id; raise exception 'Invitation has expired'; end if;
  if invitation.invited_user_id <> auth.uid() and lower(invitation.invited_email) <> lower(coalesce(auth.jwt()->>'email','')) then raise exception 'This invitation is not for you'; end if;
  if accept_invitation then
    insert into public.workspace_members(workspace_id,user_id,role) values(invitation.workspace_id,auth.uid(),'member') on conflict(workspace_id,user_id) do nothing;
    update public.workspace_invitations set status='accepted', invited_user_id=auth.uid() where id=invitation_id;
  else update public.workspace_invitations set status='rejected' where id=invitation_id; end if;
end $$;
revoke all on function public.invite_to_workspace(uuid,text), public.respond_to_invitation(uuid,boolean) from public;
grant execute on function public.invite_to_workspace(uuid,text), public.respond_to_invitation(uuid,boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;

create policy "profiles_read_self_or_teammates" on public.profiles for select to authenticated using (id=auth.uid() or public.shares_workspace(id));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy "workspaces_read_members_or_invitees" on public.workspaces for select to authenticated using (public.is_workspace_member(id) or public.has_workspace_invitation(id));
create policy "workspaces_create_owner" on public.workspaces for insert to authenticated with check (owner_id=auth.uid());
create policy "workspaces_update_managers" on public.workspaces for update to authenticated using (public.can_manage_workspace(id)) with check (public.can_manage_workspace(id));
create policy "workspaces_delete_owner" on public.workspaces for delete to authenticated using (owner_id=auth.uid());

create policy "members_read_members" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members_add_managers" on public.workspace_members for insert to authenticated with check (public.can_manage_workspace(workspace_id) and role <> 'owner');
create policy "members_change_managers" on public.workspace_members for update to authenticated using (public.can_manage_workspace(workspace_id) and role <> 'owner') with check (public.can_manage_workspace(workspace_id) and role <> 'owner');
create policy "members_remove_self_or_managers" on public.workspace_members for delete to authenticated using (role <> 'owner' and (user_id=auth.uid() or public.can_manage_workspace(workspace_id)));

create policy "invitations_read_target_or_managers" on public.workspace_invitations for select to authenticated using (invited_user_id=auth.uid() or lower(invited_email)=lower(coalesce(auth.jwt()->>'email','')) or public.can_manage_workspace(workspace_id));
create policy "invitations_create_managers" on public.workspace_invitations for insert to authenticated with check (public.can_manage_workspace(workspace_id) and invited_by=auth.uid());
create policy "invitations_update_managers" on public.workspace_invitations for update to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "invitations_delete_managers" on public.workspace_invitations for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "projects_read_members" on public.projects for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "projects_create_members" on public.projects for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by=auth.uid());
create policy "projects_update_members" on public.projects for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "projects_delete_members" on public.projects for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "tasks_read_members" on public.tasks for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "tasks_create_members" on public.tasks for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by=auth.uid());
create policy "tasks_update_members" on public.tasks for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "tasks_delete_members" on public.tasks for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "files_read_members" on public.files for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "files_create_members" on public.files for insert to authenticated with check (public.is_workspace_member(workspace_id) and uploaded_by=auth.uid());
create policy "files_delete_uploader_or_manager" on public.files for delete to authenticated using (uploaded_by=auth.uid() or public.can_manage_workspace(workspace_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('project-files','project-files',false,26214400,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg','application/zip','application/x-zip-compressed','text/plain'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "storage_project_files_read_members" on storage.objects for select to authenticated using (
  bucket_id='project-files' and (storage.foldername(name))[1]='projects' and exists(select 1 from public.projects p where p.id=((storage.foldername(name))[2])::uuid and public.is_workspace_member(p.workspace_id))
);
create policy "storage_project_files_upload_members" on storage.objects for insert to authenticated with check (
  bucket_id='project-files' and (storage.foldername(name))[1]='projects' and (storage.foldername(name))[3]=auth.uid()::text and exists(select 1 from public.projects p where p.id=((storage.foldername(name))[2])::uuid and public.is_workspace_member(p.workspace_id))
);
create policy "storage_project_files_delete_authorized" on storage.objects for delete to authenticated using (
  bucket_id='project-files' and (storage.foldername(name))[1]='projects' and (
    (storage.foldername(name))[3]=auth.uid()::text
    or exists(select 1 from public.projects p where p.id=((storage.foldername(name))[2])::uuid and public.can_manage_workspace(p.workspace_id))
  )
);

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.files;
alter publication supabase_realtime add table public.workspace_invitations;
