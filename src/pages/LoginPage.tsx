import { useState, type CSSProperties, type FormEvent } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { authApi } from '../lib/auth.api';
import { setActiveOrgId, setAuthToken } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  hasAdminMembership,
  isAdminCapable,
  persistActiveOrgId,
  resolveActiveMembership,
} from '../lib/auth';
import { brand, palette } from '../theme';

function friendlyFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const { data } = await authApi.sync();
      if (!data.user.isPlatformAdmin && !isAdminCapable(data.memberships)) {
        await signOut(firebaseAuth);
        setAuthToken(null);
        setActiveOrgId(null);
        setError('This dashboard is for organization admins only.');
        return;
      }
      const active = resolveActiveMembership(data.memberships);
      setActiveOrgId(active?.organizationId ?? null);
      if (active) persistActiveOrgId(active.organizationId);

      // Platform-admin-only accounts (no ADMIN membership anywhere) land on
      // the platform section instead of "create your organization". A user
      // who is both a platform admin and an org ADMIN keeps the normal
      // per-org dashboard as their default (App.tsx's own redirect handles
      // this same routing on reload/direct navigation).
      if (data.user.isPlatformAdmin && !hasAdminMembership(data.memberships)) {
        navigate('/platform', { replace: true });
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(code.startsWith('auth/') ? friendlyFirebaseError(code) : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: palette.background,
        padding: 24,
      }}
    >
      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{
          width: '100%',
          maxWidth: 420,
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 8px 32px rgba(7,26,51,0.06)',
        }}
      >
        <div style={{ height: 3, background: brand.blue, borderRadius: 99, margin: '-32px -32px 24px' }} />
        <p style={{ margin: 0, color: brand.blue, fontWeight: 700, letterSpacing: 0.6, fontSize: 12 }}>
          STUSECURE ADMIN
        </p>
        <h1 style={{ margin: '8px 0 8px', color: brand.navy, fontSize: 28 }}>Sign in</h1>
        <p style={{ margin: '0 0 24px', color: palette.textMuted, fontSize: 14 }}>
          Organization admins only. Students, guards, and faculty use the mobile app.
        </p>

        <label style={labelStyle}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ ...labelStyle, marginTop: 16 }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error ? (
          <p style={{ color: palette.error, fontSize: 13, marginTop: 16 }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 24,
            width: '100%',
            height: 44,
            border: 0,
            borderRadius: 12,
            background: brand.blue,
            color: '#fff',
            fontWeight: 600,
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: palette.textPrimary,
};

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  height: 44,
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box',
};
