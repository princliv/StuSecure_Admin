import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import { useAuth } from '../lib/auth';
import { getSocket, joinOrgRoom } from '../lib/socket';
import Card from '../components/Card';
import Badge, { type BadgeVariant } from '../components/Badge';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import { helpApi, type HelpRequest, type HelpRequestStatus } from '../lib/help.api';

const statusVariant: Record<HelpRequestStatus, BadgeVariant> = {
  PENDING: 'warning',
  IN_PROGRESS: 'neutral',
  RESOLVED: 'success',
  CANCELLED: 'neutral',
};

const statusLabel: Record<HelpRequestStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

const typeLabel: Record<HelpRequest['type'], string> = {
  TRANSPORTATION: 'Transportation',
  MEDICAL: 'Medical',
  HOSTEL: 'Hostel',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export default function HelpRequestsPage() {
  const queryClient = useQueryClient();
  const { activeMembership } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['help-requests'],
    queryFn: () => helpApi.list({ limit: 50 }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!activeMembership?.organizationId) return;
    joinOrgRoom(activeMembership.organizationId);

    const socket = getSocket();
    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['help-requests'] });
    socket.on('help:created', invalidate);
    socket.on('help:updated', invalidate);

    return () => {
      socket.off('help:created', invalidate);
      socket.off('help:updated', invalidate);
    };
  }, [activeMembership?.organizationId, queryClient]);

  const assignMutation = useMutation({
    mutationFn: (id: string) => helpApi.assign(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['help-requests'] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't assign this request.")),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => helpApi.resolve(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['help-requests'] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't resolve this request.")),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => helpApi.cancel(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['help-requests'] }),
    onError: (err) => window.alert(extractErrorMessage(err, "Couldn't cancel this request.")),
  });

  const closed = (row: HelpRequest) => row.status === 'RESOLVED' || row.status === 'CANCELLED';

  const columns: TableColumn<HelpRequest>[] = [
    { key: 'type', header: 'Type', render: (row) => typeLabel[row.type] },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    { key: 'student', header: 'Student', render: (row) => row.student.name },
    { key: 'description', header: 'Description', render: (row) => row.description },
    { key: 'priority', header: 'Priority', render: (row) => row.priority },
    { key: 'assignedTo', header: 'Assigned to', render: (row) => row.assignedTo?.name ?? '—' },
    { key: 'createdAt', header: 'Requested at', render: (row) => new Date(row.createdAt).toLocaleString() },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => assignMutation.mutate(row.id)}
            disabled={closed(row) || assignMutation.isPending}
          >
            Assign to me
          </Button>
          <Button
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => resolveMutation.mutate(row.id)}
            disabled={closed(row) || resolveMutation.isPending}
          >
            Resolve
          </Button>
          <Button
            variant="danger"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => cancelMutation.mutate(row.id)}
            disabled={closed(row) || cancelMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Help requests</h1>
        <p style={{ color: palette.textMuted, marginTop: 8 }}>
          Live student help requests. Updates in real time as faculty and admins respond.
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card>
          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading help requests…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load help requests. Please try again shortly.
            </p>
          ) : (
            <Table
              columns={columns}
              rows={data?.requests ?? []}
              rowKey={(row) => row.id}
              emptyMessage="No help requests yet."
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
