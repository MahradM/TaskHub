import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PageLoader } from './components/ui/States'
import { AuthLayout } from './pages/auth/AuthLayout'
import { ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const SettingsPage = lazy(() => import('./pages/profile/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const ProjectDetailsPage = lazy(() => import('./pages/project/ProjectDetailsPage').then((module) => ({ default: module.ProjectDetailsPage })))
const ProjectsPage = lazy(() => import('./pages/project/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const NotFoundPage = lazy(() => import('./pages/system/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const UnauthorizedPage = lazy(() => import('./pages/system/UnauthorizedPage').then((module) => ({ default: module.UnauthorizedPage })))
const TasksPage = lazy(() => import('./pages/task/TasksPage').then((module) => ({ default: module.TasksPage })))
const MembersPage = lazy(() => import('./pages/workspace/MembersPage').then((module) => ({ default: module.MembersPage })))
const WorkspaceOverviewPage = lazy(() => import('./pages/workspace/WorkspaceOverviewPage').then((module) => ({ default: module.WorkspaceOverviewPage })))
const WorkspacesPage = lazy(() => import('./pages/workspace/WorkspacesPage').then((module) => ({ default: module.WorkspacesPage })))

export default function App() {
  return <Suspense fallback={<PageLoader/>}><Routes><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route element={<PublicOnlyRoute/>}><Route element={<AuthLayout/>}><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/></Route></Route><Route element={<ProtectedRoute/>}><Route element={<AppShell/>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/workspaces" element={<WorkspacesPage/>}/><Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage/>}/><Route path="/workspaces/:workspaceId/projects" element={<ProjectsPage/>}/><Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDetailsPage/>}/><Route path="/workspaces/:workspaceId/tasks" element={<TasksPage/>}/><Route path="/workspaces/:workspaceId/members" element={<MembersPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/unauthorized" element={<UnauthorizedPage/>}/></Route></Route><Route path="*" element={<NotFoundPage/>}/></Routes></Suspense>
}
