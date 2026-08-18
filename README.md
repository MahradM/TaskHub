# TaskHub

TaskHub is a serverless, multi-workspace productivity application for planning projects, assigning tasks, inviting teammates, and sharing project files. The browser talks directly to Supabase; no application server is required.

## Stack

- React 19, TypeScript, and Vite
- React Router, TanStack Query, React Hook Form, and Zod
- Tailwind CSS, Lucide icons, and Sonner notifications
- Supabase PostgreSQL, Auth, Storage, Realtime, and Row Level Security
- GitHub Pages and GitHub Actions

## Features

- Username/password registration, login, persistent sessions, protected routes, and in-app password changes
- Editable user profiles created automatically at registration
- Workspace CRUD with owner/admin/member roles
- Invitations by an existing user's username, with accept/reject flows and expiry
- Project creation, editing, archiving, deletion, and project detail views
- Task CRUD, member/workspace assignment, status, priority, due dates, search, filtering, and sorting
- Drag-and-drop project file uploads, validation, signed downloads, and permission-aware deletion
- Realtime task and file updates
- Responsive app shell, loading/empty/error states, notifications, and light/dark themes

## Project structure

```text
src/
├── components/       Reusable UI, layout, workspace, project, task, and file components
├── contexts/         Authentication and theme providers
├── hooks/            Query-backed workspace hooks
├── lib/              Supabase client, validation schemas, and utilities
├── pages/            Route-level screens
├── routes/           Auth route guards
├── services/         Supabase CRUD and storage operations
└── types/            Domain types
supabase/migrations/  Database, RLS, RPC, trigger, bucket, and storage policies
.github/workflows/    GitHub Pages deployment
```

## 1. Create and configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/migrations/001_initial_schema.sql`, and run it once. This creates all tables, indexes, constraints, triggers, RPC functions, RLS policies, the private `project-files` bucket, storage policies, and Realtime publications.
3. In **Authentication → Providers → Email**, keep Email enabled, but turn **Confirm email** off. TaskHub uses Supabase's password engine with a private internal email derived from each username; no email is collected from users or sent by the app.
4. In **Authentication → URL Configuration**, set:
   - Site URL to the production GitHub Pages URL, for example `https://USERNAME.github.io/TaskHub/`
   - Redirect URLs to both the production URL and `http://localhost:5173/**`

Alternatively, with the Supabase CLI linked to the project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

If you previously installed TaskHub, also run every newer numbered migration in order. In particular, `003_workspace_creation_fix.sql` restores authenticated table grants and installs the secure workspace-creation RPC.

The migration creates the Storage bucket; no manual bucket creation or public access is needed. Keep it private.

## 2. Environment variables

Copy the sample file for local development:

```bash
cp .env.example .env.local
```

Get both values from **Supabase → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

The anon/publishable key is designed for browser use and is constrained by RLS. Never use or expose the `service_role`/secret key in this project.

## 3. Run locally

Requires Node.js 20 or newer (Node 22 is used in CI).

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Useful checks:

```bash
npm run build
npm run lint
npm run preview
```

## 4. Deploy to GitHub Pages

1. Push the repository to GitHub (the repository name can be anything).
2. In **Settings → Secrets and variables → Actions**:
   - Add repository variable `VITE_SUPABASE_URL`.
   - Add repository secret `VITE_SUPABASE_ANON_KEY`.
3. In **Settings → Pages**, select **GitHub Actions** as the source.
4. Push to `main` or run the **Deploy TaskHub to GitHub Pages** workflow manually.

The workflow installs locked dependencies, type-checks and builds the app, and deploys `dist/`. Vite derives the repository base path from `GITHUB_REPOSITORY`, so project pages work at `https://USERNAME.github.io/REPOSITORY/`. The generated `404.html` and small URL recovery script preserve BrowserRouter deep links when a user refreshes or opens a nested route directly.

## Authentication design

`AuthProvider` restores the Supabase session, listens to auth state changes, and exposes `user`, `profile`, `loading`, `signIn`, `signUp`, `changePassword`, `signOut`, and `refreshProfile`. A database trigger inserts `profiles` whenever Supabase Auth creates a user. Protected routes redirect signed-out visitors to `/login` and return them to the originally requested page after login.

Supabase Auth requires an email identifier internally. TaskHub deterministically maps the normalized username to a private `username@users.taskhub.internal` identifier in the browser before calling Supabase Auth. It is never shown in the interface, no actual email is sent, and no service-role credential is exposed. Because these addresses are intentionally non-deliverable, **Confirm email must remain disabled**. Signed-in users change their password from Settings instead of using a reset-email flow.

## Authorization and RLS

Frontend visibility is only a convenience; authorization is enforced in PostgreSQL and Storage.

- Workspace rows are readable only by members. Only owners/admins can update workspace settings and invitations; only owners can delete workspaces.
- Membership helper functions are `SECURITY DEFINER`, use an empty `search_path`, and have narrowly granted execution. This avoids recursive membership-policy evaluation.
- Projects, tasks, file metadata, and storage objects require membership in their owning workspace.
- Validation triggers enforce that tasks and files reference a project in the same workspace, that task assignees are members, and that storage paths match the project and uploader.
- Files use `projects/{project_id}/{uploader_id}/{uuid}-{safe_name}`. The private bucket returns short-lived signed download URLs. Uploaders can delete their files; workspace owners/admins can delete any project file.
- Invitation RPCs resolve users and create membership in the trusted database context. Users can respond only to invitations targeting their user ID or authenticated internal identifier.
- No service-role credential is used by the SPA.

## Production notes

- The default file limit is 25 MB and accepted formats are PDF, DOC/DOCX, XLS/XLSX, PNG, JPG/JPEG, ZIP, and TXT. Change both the frontend constants and migration bucket limits if requirements change.
- Supabase's free tier can pause inactive projects; review current plan limits before a critical launch.
- If you later add real email addresses to profiles, add SMTP credentials before enabling email confirmation or email password recovery.
- Apply later database changes as new numbered migrations rather than editing a migration already deployed to production.
