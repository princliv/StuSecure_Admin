import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { orgsApi } from '../lib/orgs.api';
import Card from '../components/Card';
import Button from '../components/Button';
import { brand, palette } from '../theme';

/**
 * Reachable for a signed-in, admin-capable user who currently has zero
 * memberships (a fresh account) — see `RequireAdmin` and `App.tsx`'s route
 * tree. Creating an org makes the caller its first ADMIN member.
 */
export default function CreateOrgPage() {
  const { applySync, signOutAdmin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await orgsApi.create(name.trim());
      applySync(data);
      navigate('/', { replace: true });
    } catch (err) {
      const maybeAxios = err as { response?: { data?: { error?: string } } };
      setError(maybeAxios.response?.data?.error ?? 'Could not create your organization. Please try again.');
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
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <p style={{ margin: 0, color: brand.blue, fontWeight: 700, letterSpacing: 0.6, fontSize: 12 }}>
          STUSECURE ADMIN
        </p>
        <h1 style={{ margin: '8px 0 8px', color: brand.navy, fontSize: 24 }}>Create your organization</h1>
        <p style={{ margin: '0 0 24px', color: palette.textMuted, fontSize: 14 }}>
          You don't belong to an organization yet. Create one to get started — you'll be its
          first admin.
        </p>

        <form onSubmit={(e) => void onSubmit(e)}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: palette.textPrimary }}>
            Organization name
            <input
              type="text"
              required
              minLength={1}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                height: 44,
                borderRadius: 12,
                border: `1px solid ${palette.border}`,
                padding: '0 12px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </label>

          {error ? <p style={{ color: palette.error, fontSize: 13, marginTop: 16 }}>{error}</p> : null}

          <Button type="submit" disabled={submitting} style={{ marginTop: 24, width: '100%' }}>
            {submitting ? 'Creating…' : 'Create organization'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void signOutAdmin()}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'transparent',
            border: 0,
            color: palette.textMuted,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </Card>
    </div>
  );
}
