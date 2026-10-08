import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { reportsApi, type RecentMovement } from '../lib/reports.api';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import StatTile from '../components/StatTile';
import Badge from '../components/Badge';
import Table, { type TableColumn } from '../components/Table';

const movementColumns: TableColumn<RecentMovement>[] = [
  {
    key: 'studentName',
    header: 'Student',
    render: (row) => row.studentName,
  },
  {
    key: 'hostelName',
    header: 'Hostel',
    render: (row) => row.hostelName ?? '—',
  },
  {
    key: 'type',
    header: 'Type',
    render: (row) => (
      <Badge variant={row.type === 'CHECK_IN' ? 'success' : 'neutral'}>
        {row.type === 'CHECK_IN' ? 'Check-in' : 'Check-out'}
      </Badge>
    ),
  },
  {
    key: 'timestamp',
    header: 'Time',
    render: (row) => new Date(row.timestamp).toLocaleString(),
  },
];

export default function OverviewPage() {
  const { profile, activeMembership } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: reportsApi.overview,
  });

  return (
    <div>
      <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Overview</h1>
      <p style={{ color: palette.textMuted, marginTop: 8 }}>
        Signed in as {profile?.displayName ?? profile?.email} · {activeMembership?.organizationName}
      </p>

      {isLoading ? (
        <p style={{ color: palette.textMuted, fontSize: 14, marginTop: 24 }}>Loading dashboard…</p>
      ) : isError ? (
        <p style={{ color: palette.error, fontSize: 14, marginTop: 24 }}>
          Couldn't load dashboard data. Please try again shortly.
        </p>
      ) : data ? (
        <>
          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <StatTile label="Students" value={data.totalStudents} />
            <StatTile label="Guards" value={data.totalGuards} />
            <StatTile label="Hostels" value={data.totalHostels} />
            <StatTile label="Inside" value={data.insideCount} />
            <StatTile label="Outside" value={data.outsideCount} />
            <StatTile label="Open emergencies" value={data.openEmergencyCount} />
            <StatTile label="Pending help requests" value={data.pendingHelpCount} />
            <StatTile label="Today's check-ins" value={data.todayCheckIns} />
            <StatTile label="Today's check-outs" value={data.todayCheckOuts} />
          </div>

          <div style={{ marginTop: 24 }}>
            <Card title="Recent activity">
              <Table
                columns={movementColumns}
                rows={data.recentMovements}
                rowKey={(row) => row.id}
                emptyMessage="No recent movement activity."
              />
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
