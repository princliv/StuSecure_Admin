import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Badge, { type BadgeVariant } from '../components/Badge';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import { invitesApi, type Invite, type InviteStatus, type ImportInvitesResult } from '../lib/invites.api';
import type { Role } from '../lib/auth.api';

const statusVariant: Record<InviteStatus, BadgeVariant> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REVOKED: 'neutral',
  EXPIRED: 'neutral',
};

const roleOptions: Role[] = ['STUDENT', 'GUARD', 'FACULTY', 'ADMIN'];
const statusFilterOptions: (InviteStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'];

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function InvitesPage() {
  const { activeMembership } = useAuth();
  const orgId = activeMembership?.organizationId ?? '';
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'ALL'>('ALL');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportInvitesResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invites', orgId, statusFilter],
    queryFn: () =>
      invitesApi
        .list(orgId, statusFilter === 'ALL' ? { limit: 100 } : { status: statusFilter, limit: 100 })
        .then((res) => res.data),
    enabled: Boolean(orgId),
  });

  const createMutation = useMutation({
    mutationFn: () => invitesApi.create(orgId, { email: email.trim(), role }),
    onSuccess: () => {
      setEmail('');
      setCreateError(null);
      void queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
    },
    onError: (err) => setCreateError(extractErrorMessage(err, "Couldn't create this invite.")),
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => invitesApi.revoke(orgId, inviteId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['invites', orgId] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't revoke this invite.")),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => invitesApi.importCsv(orgId, csv),
    onSuccess: (res) => {
      setImportResult(res.data);
      setImportError(null);
      void queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
    },
    onError: (err) => {
      setImportResult(null);
      setImportError(extractErrorMessage(err, "Couldn't import this CSV file."));
    },
  });

  const onCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate();
  };

  const onCopyToken = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.token);
      setCopiedId(invite.id);
      window.setTimeout(() => setCopiedId((current) => (current === invite.id ? null : current)), 2000);
    } catch {
      // Clipboard permission denied — the token is still visible in the row.
    }
  };

  const onRevoke = (invite: Invite) => {
    if (!window.confirm(`Revoke the invite for ${invite.email}?`)) return;
    revokeMutation.mutate(invite.id);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      importMutation.mutate(text);
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
    // Allow re-selecting the same file later.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const columns: TableColumn<Invite>[] = [
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'role', header: 'Role', render: (row) => <Badge>{row.role}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    { key: 'token', header: 'Token', render: (row) => <code style={{ fontSize: 12 }}>{row.token}</code> },
    { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => void onCopyToken(row)}
          >
            {copiedId === row.id ? 'Copied!' : 'Copy link'}
          </Button>
          <Button
            variant="danger"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => onRevoke(row)}
            disabled={row.status !== 'PENDING' || revokeMutation.isPending}
          >
            Revoke
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Invites</h1>
        <p style={{ color: palette.textMuted, marginTop: 8 }}>
          Invite students, guards, faculty, and other admins into your organization. Invites
          are link-based — copy the token and share it with the invitee.
        </p>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Create an invite">
          <form onSubmit={onCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: palette.textPrimary }}>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  padding: '0 12px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600, color: palette.textPrimary }}>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  padding: '0 12px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {createError ? <p style={{ color: palette.error, fontSize: 13, margin: 0 }}>{createError}</p> : null}
            <Button type="submit" disabled={createMutation.isPending || !orgId}>
              {createMutation.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
        </Card>

        <Card title="Bulk import via CSV">
          <p style={{ margin: '0 0 12px', color: palette.textMuted, fontSize: 13 }}>
            Columns: <code>name,email,role</code> with a header row. Up to 500 rows.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            disabled={importMutation.isPending || !orgId}
          />
          {importMutation.isPending ? (
            <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 12 }}>Importing…</p>
          ) : null}
          {importError ? <p style={{ color: palette.error, fontSize: 13, marginTop: 12 }}>{importError}</p> : null}
          {importResult ? (
            <div style={{ marginTop: 12, fontSize: 13, color: palette.textPrimary }}>
              <p style={{ margin: 0 }}>
                Created {importResult.created} invite{importResult.created === 1 ? '' : 's'}
                {importResult.truncated ? ' (file truncated at 500 rows)' : ''}.
              </p>
              {importResult.skipped.length > 0 ? (
                <>
                  <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>Skipped rows:</p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importResult.skipped.map((s) => (
                      <li key={s.row}>
                        Row {s.row}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="All invites">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {statusFilterOptions.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'primary' : 'secondary'}
                style={{ height: 32, padding: '0 12px' }}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'ALL' ? 'All' : s}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading invites…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>Couldn't load invites. Please try again shortly.</p>
          ) : (
            <Table
              columns={columns}
              rows={data?.invites ?? []}
              rowKey={(row) => row.id}
              emptyMessage="No invites yet."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
