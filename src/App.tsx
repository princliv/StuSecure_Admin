import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { hasAdminMembership, useAuth } from './lib/auth';
import AppShell from './layout/AppShell';
import RequireAdmin from './layout/RequireAdmin';
import RequirePlatformAdmin from './layout/RequirePlatformAdmin';
import PlatformShell from './layout/PlatformShell';
import LoginPage from './pages/LoginPage';
import CreateOrgPage from './pages/CreateOrgPage';
import OverviewPage from './pages/OverviewPage';
import StudentsPage from './pages/StudentsPage';
import GuardsPage from './pages/GuardsPage';
import FacultyPage from './pages/FacultyPage';
import HostelsPage from './pages/HostelsPage';
import EmergenciesPage from './pages/EmergenciesPage';
import HelpRequestsPage from './pages/HelpRequestsPage';
import ReportsPage from './pages/ReportsPage';
import InvitesPage from './pages/InvitesPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import PlatformOrgsPage from './pages/PlatformOrgsPage';

export default function App() {
  const { firebaseUser, memberships, isPlatformAdmin, loading } = useAuth();

  const signedInAdminCapable = !loading && Boolean(firebaseUser) && hasAdminMembership(memberships);
  // A signed-in account with zero ADMIN memberships lands on
  // /create-organization UNLESS it's platform-admin-only, in which case
  // /platform (via RequirePlatformAdmin) is its home instead.
  const signedInNoOrgYet =
    !loading && Boolean(firebaseUser) && memberships.length === 0 && !isPlatformAdmin;
  const signedInPlatformAdminOnly =
    !loading && Boolean(firebaseUser) && !signedInAdminCapable && isPlatformAdmin;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            signedInAdminCapable ? (
              <Navigate to="/" replace />
            ) : signedInPlatformAdminOnly ? (
              <Navigate to="/platform" replace />
            ) : signedInNoOrgYet ? (
              <Navigate to="/create-organization" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/create-organization"
          element={
            !loading && !firebaseUser ? (
              <Navigate to="/login" replace />
            ) : signedInAdminCapable ? (
              <Navigate to="/" replace />
            ) : signedInPlatformAdminOnly ? (
              <Navigate to="/platform" replace />
            ) : (
              <CreateOrgPage />
            )
          }
        />
        <Route element={<RequireAdmin />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/guards" element={<GuardsPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/hostels" element={<HostelsPage />} />
            <Route path="/emergencies" element={<EmergenciesPage />} />
            <Route path="/help-requests" element={<HelpRequestsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/invites" element={<InvitesPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<RequirePlatformAdmin />}>
          <Route element={<PlatformShell />}>
            <Route path="/platform" element={<PlatformOrgsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
