import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import { useAuth } from '../lib/auth';
import { getSocket, joinOrgRoom } from '../lib/socket';
import Card from '../components/Card';
import Badge, { type BadgeVariant } from '../components/Badge';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import { emergencyApi, type Emergency, type EmergencyStatus } from '../lib/emergency.api';

const statusVariant: Record<EmergencyStatus, BadgeVariant> = {
  ACTIVE: 'error',
  ACKNOWLEDGED: 'warning',
  RESOLVED: 'success',
  CANCELLED: 'neutral',
};

const statusLabel: Record<EmergencyStatus, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

export default function EmergenciesPage() {
  const queryClient = useQueryClient();
  const { activeMembership } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emergencies'],
    queryFn: () => emergencyApi.list({ limit: 50 }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!activeMembership?.organizationId) return;
    joinOrgRoom(activeMembership.organizationId);

    const socket = getSocket();
    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['emergencies'] });
    socket.on('emergency:created', invalidate);
    socket.on('emergency:updated', invalidate);

    return () => {
      socket.off('emergency:created', invalidate);
      socket.off('emergency:updated', invalidate);
    };
  }, [activeMembership?.organizationId, queryClient]);

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => emergencyApi.acknowledge(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['emergencies'] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't acknowledge this emergency.")),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => emergencyApi.resolve(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['emergencies'] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't resolve this emergency.")),
  });

  const columns: TableColumn<Emergency>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    { key: 'reporter', header: 'Reported by', render: (row) => row.reportedBy.name },
    { key: 'description', header: 'Description', render: (row) => row.description },
    {
      key: 'location',
      header: 'Location',
      render: (row) => row.location ?? row.reportedBy.hostelName ?? '—',
    },
    { key: 'createdAt', header: 'Reported at', render: (row) => new Date(row.createdAt).toLocaleString() },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => acknowledgeMutation.mutate(row.id)}
            disabled={row.status !== 'ACTIVE' || acknowledgeMutation.isPending}
          >
            Acknowledge
          </Button>
          <Button
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => resolveMutation.mutate(row.id)}
            disabled={row.status === 'RESOLVED' || row.status === 'CANCELLED' || resolveMutation.isPending}
          >
            Resolve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Emergencies</h1>
        <p style={{ color: palette.textMuted, marginTop: 8 }}>
          Live SOS alerts from students. Updates in real time as guards and faculty respond.
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card>
          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading emergencies…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load emergencies. Please try again shortly.
            </p>
          ) : (
            <Table
              columns={columns}
              rows={data?.emergencies ?? []}
              rowKey={(row) => row.id}
              emptyMessage="No emergencies reported."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}
