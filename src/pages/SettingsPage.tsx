import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { orgsApi } from '../lib/orgs.api';
import Card from '../components/Card';
import Button from '../components/Button';
import { palette } from '../theme';

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: palette.textPrimary };
const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  height: 44,
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

/**
 * Org self-service branding — name/logo/primary color. ADMIN-only via
 * RequireAdmin. See docs/StuSecure_SaaS_Plan.md Group G4.
 */
export default function SettingsPage() {
  const { activeMembership, patchOrgBranding } = useAuth();
  const orgId = activeMembership?.organizationId ?? '';
  const orgSlug = activeMembership?.organizationSlug ?? '';

  const [name, setName] = useState(activeMembership?.organizationName ?? '');
  const [logoUrl, setLogoUrl] = useState(activeMembership?.organizationLogoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(activeMembership?.organizationPrimaryColor ?? '');
  const [logoError, setLogoError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const onCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(orgSlug);
      setSlugCopied(true);
      window.setTimeout(() => setSlugCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the ID is still visible on screen.
    }
  };

  useEffect(() => {
    setName(activeMembership?.organizationName ?? '');
    setLogoUrl(activeMembership?.organizationLogoUrl ?? '');
    setPrimaryColor(activeMembership?.organizationPrimaryColor ?? '');
  }, [activeMembership?.organizationId]);

  const mutation = useMutation({
    mutationFn: () =>
      orgsApi.updateProfile(orgId, {
        name: name.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        primaryColor: primaryColor.trim() || undefined,
      }),
    onSuccess: ({ data }) => {
      patchOrgBranding(orgId, {
        name: data.name,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
      });
      setFormError(null);
      setSuccessMessage('Saved.');
    },
    onError: (err) => {
      setSuccessMessage(null);
      setFormError(extractErrorMessage(err, 'Could not save your organization profile.'));
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setFormError(null);

    if (primaryColor.trim() && !HEX_COLOR_RE.test(primaryColor.trim())) {
      setFormError('Primary color must be a hex color like #1A2B3C.');
      return;
    }

    mutation.mutate();
  };

  const onColorPickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };

  const onColorTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, color: palette.textPrimary }}>Settings</h1>

      <Card title="Organization ID">
        <p style={{ margin: '0 0 12px', color: palette.textMuted, fontSize: 13 }}>
          Share this with your students, guards, and faculty — they'll need it to register or
          sign in.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code
            style={{
              flex: 1,
              display: 'block',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              background: palette.surfaceVariant,
              fontSize: 14,
            }}
          >
            {orgSlug}
          </code>
          <Button type="button" variant="secondary" onClick={() => void onCopySlug()}>
            {slugCopied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: 24 }} />

      <Card title="Organization profile">
        <form onSubmit={onSubmit}>
          <label style={labelStyle}>
            Organization name
            <input
              type="text"
              minLength={1}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ ...labelStyle, marginTop: 20 }}>
            Logo URL
            <input
              type="text"
              maxLength={2048}
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setLogoError(false);
              }}
              placeholder="https://example.com/logo.png"
              style={inputStyle}
            />
          </label>
          {logoUrl.trim() && !logoError ? (
            <img
              src={logoUrl.trim()}
              alt="Logo preview"
              onError={() => setLogoError(true)}
              style={{ height: 48, marginTop: 10, display: 'block', borderRadius: 6 }}
            />
          ) : null}

          <label style={{ ...labelStyle, marginTop: 20 }}>
            Primary color
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <input
                type="color"
                value={HEX_COLOR_RE.test(primaryColor.trim()) ? primaryColor.trim() : '#155EEF'}
                onChange={onColorPickerChange}
                style={{ width: 44, height: 44, padding: 0, border: `1px solid ${palette.border}`, borderRadius: 8 }}
              />
              <input
                type="text"
                placeholder="#155EEF"
                maxLength={7}
                value={primaryColor}
                onChange={onColorTextChange}
                style={{ ...inputStyle, marginTop: 0, flex: 1 }}
              />
            </div>
          </label>

          {formError ? <p style={{ color: palette.error, fontSize: 13, marginTop: 16 }}>{formError}</p> : null}
          {successMessage ? (
            <p style={{ color: '#1a7f37', fontSize: 13, marginTop: 16 }}>{successMessage}</p>
          ) : null}

          <Button type="submit" disabled={mutation.isPending || !orgId} style={{ marginTop: 24 }}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
