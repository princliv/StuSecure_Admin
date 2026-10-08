import { useState, type CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { brand, palette } from '../theme';

const nav = [
  { to: '/', label: 'Overview' },
  { to: '/students', label: 'Students' },
  { to: '/guards', label: 'Guards' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/hostels', label: 'Hostels' },
  { to: '/emergencies', label: 'Emergencies' },
  { to: '/help-requests', label: 'Help Requests' },
  { to: '/reports', label: 'Reports' },
  { to: '/invites', label: 'Invites' },
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/settings', label: 'Settings' },
];

export default function AppShell() {
  const { profile, memberships, activeMembership, isPlatformAdmin, switchOrg, signOutAdmin } = useAuth();
  const queryClient = useQueryClient();
  const adminMemberships = memberships.filter((m) => m.role === 'ADMIN');
  const [logoError, setLogoError] = useState(false);

  // Scoped accent-color application (nav highlight + primary buttons only)
  // — see docs/StuSecure_SaaS_Plan.md Group G4.
  const accentStyle = {
    '--org-accent': activeMembership?.organizationPrimaryColor || brand.blue,
  } as CSSProperties;

  const onSwitchOrg = async (organizationId: string) => {
    if (organizationId === activeMembership?.organizationId) return;
    await switchOrg(organizationId);
    void queryClient.invalidateQueries();
  };

  return (
    <div style={{ ...accentStyle, minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <aside
        style={{
          background: brand.navy,
          color: '#fff',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {activeMembership?.organizationLogoUrl && !logoError ? (
          <img
            src={activeMembership.organizationLogoUrl}
            alt={activeMembership.organizationName}
            onError={() => setLogoError(true)}
            style={{ height: 32, maxWidth: '100%', objectFit: 'contain', marginBottom: 16 }}
          />
        ) : (
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>StuSecure</div>
        )}
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              color: isActive ? 'var(--org-accent)' : '#fff',
              textDecoration: 'none',
              padding: '8px 0',
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              opacity: isActive ? 1 : 0.8,
            })}
          >
            {item.label}
          </NavLink>
        ))}
        {isPlatformAdmin ? (
          <NavLink
            to="/platform"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 0',
              fontSize: 14,
              fontWeight: 500,
              opacity: 0.8,
              borderTop: '1px solid rgba(255,255,255,0.2)',
              marginTop: 8,
              paddingTop: 16,
            }}
          >
            Platform admin →
          </NavLink>
        ) : null}
        <div style={{ marginTop: 'auto', fontSize: 12, opacity: 0.7 }}>
          {adminMemberships.length > 1 ? (
            <select
              value={activeMembership?.organizationId ?? ''}
              onChange={(e) => void onSwitchOrg(e.target.value)}
              style={{
                width: '100%',
                background: brand.navy,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 12,
              }}
            >
              {adminMemberships.map((m) => (
                <option key={m.organizationId} value={m.organizationId} style={{ color: palette.textPrimary }}>
                  {m.organizationName}
                </option>
              ))}
            </select>
          ) : (
            activeMembership?.organizationName ?? 'Organization'
          )}
        </div>
      </aside>
      <div style={{ background: palette.background, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 64,
            background: palette.surface,
            borderBottom: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <span style={{ color: palette.textMuted, fontSize: 14 }}>{profile?.email}</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Sign out?')) void signOutAdmin();
            }}
            style={{
              border: `1px solid ${palette.border}`,
              background: palette.surface,
              borderRadius: 10,
              height: 36,
              padding: '0 14px',
              cursor: 'pointer',
              color: palette.textPrimary,
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </header>
        <main style={{ padding: 24, flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
