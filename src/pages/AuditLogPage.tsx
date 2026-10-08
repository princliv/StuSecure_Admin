import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import { useAuth } from '../lib/auth';
import Card from '../components/Card';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import { auditLogsApi, type AuditLogEntry } from '../lib/auditLogs.api';

const PAGE_SIZE = 20;

function MetadataCell({ metadata }: { metadata: unknown }) {
  if (metadata == null || (typeof metadata === 'object' && Object.keys(metadata).length === 0)) {
    return <span style={{ color: palette.textMuted }}>—</span>;
  }
  const json = JSON.stringify(metadata);
  const preview = json.length > 60 ? `${json.slice(0, 60)}…` : json;
  return (
    <details>
      <summary style={{ cursor: 'pointer', fontSize: 12, color: palette.textMuted }}>{preview}</summary>
      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: '6px 0 0' }}>{JSON.stringify(metadata, null, 2)}</pre>
    </details>
  );
}

export default function AuditLogPage() {
  const { activeMembership } = useAuth();
  const orgId = activeMembership?.organizationId ?? '';
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', orgId, page, entityType],
    queryFn: () =>
      auditLogsApi
        .list(orgId, { page, limit: PAGE_SIZE, ...(entityType ? { entityType } : {}) })
        .then((res) => res.data),
    enabled: Boolean(orgId),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const columns: TableColumn<AuditLogEntry>[] = [
    { key: 'createdAt', header: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (row.actor ? `${row.actor.name} (${row.actor.email})` : '—'),
    },
    { key: 'action', header: 'Action', render: (row) => row.action },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <span>
          {row.entityType} <code style={{ fontSize: 12 }}>{row.entityId}</code>
        </span>
      ),
    },
    { key: 'metadata', header: 'Details', render: (row) => <MetadataCell metadata={row.metadata} /> },
  ];

  return (
    <div>
      <div>
        <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Audit Log</h1>
        <p style={{ color: palette.textMuted, marginTop: 8 }}>
          Administrative/structural changes in your organization — who created, updated, or removed
          students, guards, hostels, rooms, invites, and org settings. Read-only.
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title="Activity">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: palette.textMuted }}>
              Entity type
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                style={{
                  marginLeft: 8,
                  height: 32,
                  borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                  padding: '0 8px',
                  fontSize: 13,
                }}
              >
                <option value="">All</option>
                <option value="Student">Student</option>
                <option value="SecurityGuard">SecurityGuard</option>
                <option value="Hostel">Hostel</option>
                <option value="Room">Room</option>
                <option value="Invite">Invite</option>
                <option value="Organization">Organization</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading audit log…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>Couldn't load the audit log. Please try again shortly.</p>
          ) : (
            <>
              <Table
                columns={columns}
                rows={data?.auditLogs ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No activity recorded yet."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: palette.textMuted }}>
                  Page {data?.page ?? page} of {totalPages} ({data?.total ?? 0} total)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    style={{ height: 32, padding: '0 12px' }}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ height: 32, padding: '0 12px' }}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
