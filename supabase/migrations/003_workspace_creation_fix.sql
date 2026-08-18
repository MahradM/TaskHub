-- Repairs workspace creation for projects where table grants or the original
-- workspace policy were not applied completely. Safe to run more than once.

grant usage on schema public to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.workspace_invitations to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.files to authenticated;

-- Restore profiles for Auth users created while the profile trigger was absent.
insert into public.profiles (id, email, username, full_name)
select
  users.id,
  users.email,
  coalesce(
    nullif(users.raw_user_meta_data->>'username', ''),
    split_part(users.email, '@', 1) || '_' || substr(users.id::text, 1, 6)
  ),
  nullif(users.raw_user_meta_data->>'full_name', '')
from auth.users as users
where users.email is not null
  and not exists (select 1 from public.profiles where profiles.id = users.id)
on conflict do nothing;

create or replace function public.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';
  return new;
end
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
after insert on public.workspaces
for each row execute function public.add_workspace_owner();

drop policy if exists "workspaces_create_owner" on public.workspaces;
create policy "workspaces_create_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

-- The RPC is narrowly scoped and uses the authenticated JWT user as owner.
-- It avoids relying on PostgREST to apply a column default before an RLS check.
create or replace function public.create_workspace(
  workspace_name text,
  workspace_description text default null
)
returns setof public.workspaces
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Your profile is missing. Sign out and create the account again.';
  end if;

  if char_length(trim(workspace_name)) not between 2 and 80 then
    raise exception 'Workspace name must contain between 2 and 80 characters.';
  end if;

  return query
  insert into public.workspaces (name, description, owner_id)
  values (trim(workspace_name), nullif(trim(workspace_description), ''), auth.uid())
  returning *;
end
$$;

revoke all on function public.create_workspace(text, text) from public;
grant execute on function public.create_workspace(text, text) to authenticated;
