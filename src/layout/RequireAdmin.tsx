import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { palette } from '../theme';

export default function RequireAdmin() {
  const { loading, firebaseUser, memberships, activeMembership } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: palette.textMuted }}>
        Loading…
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Zero memberships is a valid state (fresh admin account) — route to the
  // "create your organization" screen instead of bouncing to /login. Any
  // user with memberships but none ADMIN was already signed out by
  // AuthProvider, so reaching here with memberships.length > 0 implies at
  // least one ADMIN membership exists.
  if (memberships.length === 0) {
    return <Navigate to="/create-organization" replace />;
  }

  if (!activeMembership) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: palette.textMuted }}>
        Loading…
      </div>
    );
  }

  return <Outlet />;
}
