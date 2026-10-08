import { useEffect, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatTile from '../components/StatTile';
import Table, { type TableColumn } from '../components/Table';
import {
  platformApi,
  PLAN_KEYS,
  type OrganizationStatus,
  type PlatformOrganization,
  type UpdateOrganizationBody,
} from '../lib/platform.api';

const PAGE_SIZE = 20;

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function PlatformOrgsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const statsQuery = useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformApi.getStats(),
  });

  const orgsQuery = useQuery({
    queryKey: ['platform', 'organizations', page, PAGE_SIZE, search],
    queryFn: () => platformApi.listOrgs({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateOrganizationBody }) =>
      platformApi.updateOrg(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
      void queryClient.invalidateQueries({ queryKey: ['platform', 'stats'] });
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't update this organization. Please try again."));
    },
  });

  const onPlanChange = (org: PlatformOrganization, plan: string) => {
    if (plan === org.plan) return;
    updateMutation.mutate({ id: org.id, body: { plan } });
  };

  const onStatusChange = (org: PlatformOrganization, status: OrganizationStatus) => {
    if (status === org.status) return;
    if (
      status === 'SUSPENDED' &&
      !window.confirm(
        `Suspend ${org.name}? This will immediately lock out all of its members until it is reactivated.`,
      )
    ) {
      return;
    }
    updateMutation.mutate({ id: org.id, body: { status } });
  };

  const stats = statsQuery.data?.data;
  const data = orgsQuery.data?.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: TableColumn<PlatformOrganization>[] = [
    { key: 'name', header: 'Organization', render: (row) => row.name },
    { key: 'slug', header: 'Slug', render: (row) => row.slug },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => (
        <select
          value={row.plan}
          onChange={(e) => onPlanChange(row, e.target.value)}
          disabled={updateMutation.isPending}
          style={selectStyle}
        >
          {PLAN_KEYS.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
          {!PLAN_KEYS.includes(row.plan as (typeof PLAN_KEYS)[number]) ? (
            <option value={row.plan}>{row.plan}</option>
          ) : null}
        </select>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant={row.status === 'ACTIVE' ? 'success' : 'error'}>{row.status}</Badge>
          <select
            value={row.status}
            onChange={(e) => onStatusChange(row, e.target.value as OrganizationStatus)}
            disabled={updateMutation.isPending}
            style={selectStyle}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Students / Guards / Faculty / Admins',
      render: (row) =>
        `${row.memberCounts.students} / ${row.memberCounts.guards} / ${row.memberCounts.faculty} / ${row.memberCounts.admins}`,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div>
        <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Organizations</h1>
        <p style={{ color: palette.textMuted, marginTop: 8 }}>
          Every organization on the StuSecure platform.
        </p>
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <StatTile label="Total organizations" value={stats?.totalOrganizations ?? '—'} />
        <StatTile label="Active orgs" value={stats?.organizationsByStatus.ACTIVE ?? '—'} />
        <StatTile label="Suspended orgs" value={stats?.organizationsByStatus.SUSPENDED ?? '—'} />
        <StatTile label="Students" value={stats?.usersByRole.STUDENT ?? '—'} />
        <StatTile label="Guards" value={stats?.usersByRole.GUARD ?? '—'} />
        <StatTile label="Faculty" value={stats?.usersByRole.FACULTY ?? '—'} />
        <StatTile label="Admins" value={stats?.usersByRole.ADMIN ?? '—'} />
      </div>

      <div style={{ marginTop: 24 }}>
        <input
          type="search"
          placeholder="Search organizations by name or slug…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          {orgsQuery.isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading organizations…</p>
          ) : orgsQuery.isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load organizations. Please try again shortly.
            </p>
          ) : (
            <>
              <Table
                columns={columns}
                rows={data?.organizations ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No organizations found."
              />
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: palette.textMuted, fontSize: 13 }}>
                  {total} organization{total === 1 ? '' : 's'} · Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={pagerButtonStyle}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={pagerButtonStyle}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

const selectStyle: CSSProperties = {
  height: 32,
  borderRadius: 8,
  border: `1px solid ${palette.border}`,
  padding: '0 8px',
  fontSize: 13,
  background: palette.surface,
  color: palette.textPrimary,
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  height: 40,
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box',
  background: palette.surface,
};

const pagerButtonStyle: CSSProperties = {
  height: 32,
  padding: '0 12px',
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  fontWeight: 600,
  cursor: 'pointer',
};
