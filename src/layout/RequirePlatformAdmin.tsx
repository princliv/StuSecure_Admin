import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { palette } from '../theme';

export default function RequirePlatformAdmin() {
  const { loading, firebaseUser, isPlatformAdmin } = useAuth();

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

  // Signed in but not a platform admin — they may still be a valid org
  // admin, so send them to their normal dashboard rather than /login.
  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
