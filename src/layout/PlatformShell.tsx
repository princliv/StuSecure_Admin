import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { brand, palette } from '../theme';

const nav = [{ to: '/platform', label: 'Organizations' }];

export default function PlatformShell() {
  const { profile, signOutAdmin } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
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
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>StuSecure Platform</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            style={({ isActive }) => ({
              color: '#fff',
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
        <div style={{ marginTop: 'auto', fontSize: 12, opacity: 0.7 }}>Platform super-admin</div>
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
            onClick={() => void signOutAdmin()}
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
