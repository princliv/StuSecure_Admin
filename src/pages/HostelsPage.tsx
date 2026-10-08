import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import {
  hostelsApi,
  type CreateHostelBody,
  type Hostel,
  type UpdateHostelBody,
} from '../lib/hostels.api';
import {
  roomsApi,
  type CreateRoomBody,
  type Room,
  type UpdateRoomBody,
} from '../lib/rooms.api';

const PAGE_SIZE = 20;

type HostelFormMode = { kind: 'create' } | { kind: 'edit'; hostel: Hostel };
type RoomFormMode = { kind: 'create' } | { kind: 'edit'; room: Room };

interface HostelFormState {
  name: string;
}

interface RoomFormState {
  number: string;
  capacity: string;
}

function emptyHostelForm(): HostelFormState {
  return { name: '' };
}

function hostelFormFrom(hostel: Hostel): HostelFormState {
  return { name: hostel.name };
}

function emptyRoomForm(): RoomFormState {
  return { number: '', capacity: '' };
}

function roomFormFrom(room: Room): RoomFormState {
  return { number: room.number, capacity: room.capacity != null ? String(room.capacity) : '' };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function HostelsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);

  const [hostelFormMode, setHostelFormMode] = useState<HostelFormMode | null>(null);
  const [hostelForm, setHostelForm] = useState<HostelFormState>(emptyHostelForm());
  const [hostelFormError, setHostelFormError] = useState<string | null>(null);

  const [roomFormMode, setRoomFormMode] = useState<RoomFormMode | null>(null);
  const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm());
  const [roomFormError, setRoomFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hostelsQuery = useQuery({
    queryKey: ['hostels', page, PAGE_SIZE, search],
    queryFn: () => hostelsApi.list({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms', selectedHostelId],
    queryFn: () => roomsApi.list({ hostelId: selectedHostelId as string, limit: 100 }),
    enabled: !!selectedHostelId,
  });

  const selectedHostel = hostelsQuery.data?.hostels.find((h) => h.id === selectedHostelId) ?? null;

  const createHostelMutation = useMutation({
    mutationFn: (body: CreateHostelBody) => hostelsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hostels'] });
      closeHostelForm();
    },
  });

  const updateHostelMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateHostelBody }) =>
      hostelsApi.update(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hostels'] });
      closeHostelForm();
    },
  });

  const deleteHostelMutation = useMutation({
    mutationFn: (id: string) => hostelsApi.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['hostels'] });
      if (selectedHostelId === id) setSelectedHostelId(null);
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't delete this hostel. Please try again."));
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: (body: CreateRoomBody) => roomsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms', selectedHostelId] });
      void queryClient.invalidateQueries({ queryKey: ['hostels'] });
      closeRoomForm();
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateRoomBody }) => roomsApi.update(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms', selectedHostelId] });
      closeRoomForm();
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms', selectedHostelId] });
      void queryClient.invalidateQueries({ queryKey: ['hostels'] });
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't delete this room. Please try again."));
    },
  });

  const openCreateHostelForm = () => {
    setHostelForm(emptyHostelForm());
    setHostelFormError(null);
    setHostelFormMode({ kind: 'create' });
  };

  const openEditHostelForm = (hostel: Hostel) => {
    setHostelForm(hostelFormFrom(hostel));
    setHostelFormError(null);
    setHostelFormMode({ kind: 'edit', hostel });
  };

  const closeHostelForm = () => {
    setHostelFormMode(null);
    setHostelFormError(null);
  };

  const onDeleteHostel = (hostel: Hostel) => {
    if (!window.confirm(`Delete hostel "${hostel.name}"? This cannot be undone.`)) return;
    deleteHostelMutation.mutate(hostel.id);
  };

  const onSubmitHostel = async (e: FormEvent) => {
    e.preventDefault();
    setHostelFormError(null);
    if (!hostelFormMode) return;

    try {
      if (hostelFormMode.kind === 'create') {
        await createHostelMutation.mutateAsync({ name: hostelForm.name.trim() });
      } else {
        await updateHostelMutation.mutateAsync({
          id: hostelFormMode.hostel.id,
          body: { name: hostelForm.name.trim() },
        });
      }
    } catch (err) {
      setHostelFormError(extractErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

  const openCreateRoomForm = () => {
    setRoomForm(emptyRoomForm());
    setRoomFormError(null);
    setRoomFormMode({ kind: 'create' });
  };

  const openEditRoomForm = (room: Room) => {
    setRoomForm(roomFormFrom(room));
    setRoomFormError(null);
    setRoomFormMode({ kind: 'edit', room });
  };

  const closeRoomForm = () => {
    setRoomFormMode(null);
    setRoomFormError(null);
  };

  const onDeleteRoom = (room: Room) => {
    if (!window.confirm(`Delete room "${room.number}"? This cannot be undone.`)) return;
    deleteRoomMutation.mutate(room.id);
  };

  const onSubmitRoom = async (e: FormEvent) => {
    e.preventDefault();
    setRoomFormError(null);
    if (!roomFormMode || !selectedHostelId) return;

    const capacity = roomForm.capacity.trim() ? Number(roomForm.capacity.trim()) : undefined;

    try {
      if (roomFormMode.kind === 'create') {
        await createRoomMutation.mutateAsync({
          hostelId: selectedHostelId,
          number: roomForm.number.trim(),
          capacity,
        });
      } else {
        await updateRoomMutation.mutateAsync({
          id: roomFormMode.room.id,
          body: { number: roomForm.number.trim(), capacity },
        });
      }
    } catch (err) {
      setRoomFormError(extractErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

  const hostelSubmitting = createHostelMutation.isPending || updateHostelMutation.isPending;
  const roomSubmitting = createRoomMutation.isPending || updateRoomMutation.isPending;

  const total = hostelsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hostelColumns: TableColumn<Hostel>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedHostelId(row.id === selectedHostelId ? null : row.id)}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            color: row.id === selectedHostelId ? brand.blue : palette.textPrimary,
            fontWeight: row.id === selectedHostelId ? 700 : 500,
            cursor: 'pointer',
            fontSize: 14,
            textDecoration: 'underline',
          }}
        >
          {row.name}
        </button>
      ),
    },
    { key: 'roomCount', header: 'Rooms', render: (row) => row.roomCount },
    { key: 'guardCount', header: 'Guards', render: (row) => row.guardCount },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" style={{ height: 32, padding: '0 12px' }} onClick={() => openEditHostelForm(row)}>
            Edit
          </Button>
          <Button
            variant="danger"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => onDeleteHostel(row)}
            disabled={deleteHostelMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const roomColumns: TableColumn<Room>[] = [
    { key: 'number', header: 'Number', render: (row) => row.number },
    { key: 'capacity', header: 'Capacity', render: (row) => row.capacity ?? '—' },
    { key: 'occupants', header: 'Occupants', render: (row) => row.occupantCount },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" style={{ height: 32, padding: '0 12px' }} onClick={() => openEditRoomForm(row)}>
            Edit
          </Button>
          <Button
            variant="danger"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => onDeleteRoom(row)}
            disabled={deleteRoomMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Hostels</h1>
          <p style={{ color: palette.textMuted, marginTop: 8 }}>
            Manage hostels and their rooms. Select a hostel to view and manage its rooms.
          </p>
        </div>
        <Button onClick={openCreateHostelForm}>Add hostel</Button>
      </div>

      <div style={{ marginTop: 24 }}>
        <input
          type="search"
          placeholder="Search by hostel name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          {hostelsQuery.isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading hostels…</p>
          ) : hostelsQuery.isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load hostels. Please try again shortly.
            </p>
          ) : (
            <>
              <Table
                columns={hostelColumns}
                rows={hostelsQuery.data?.hostels ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No hostels found."
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
                  {total} hostel{total === 1 ? '' : 's'} · Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    style={{ height: 32, padding: '0 12px' }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ height: 32, padding: '0 12px' }}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {selectedHostelId ? (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, color: brand.navy, fontSize: 20 }}>
              Rooms in {selectedHostel?.name ?? 'hostel'}
            </h2>
            <Button onClick={openCreateRoomForm}>Add room</Button>
          </div>

          <div style={{ marginTop: 16 }}>
            <Card>
              {roomsQuery.isLoading ? (
                <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading rooms…</p>
              ) : roomsQuery.isError ? (
                <p style={{ color: palette.error, fontSize: 14 }}>
                  Couldn't load rooms. Please try again shortly.
                </p>
              ) : (
                <Table
                  columns={roomColumns}
                  rows={roomsQuery.data?.rooms ?? []}
                  rowKey={(row) => row.id}
                  emptyMessage="No rooms in this hostel yet."
                />
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {hostelFormMode ? (
        <div style={modalOverlayStyle} onClick={closeHostelForm}>
          <form
            onSubmit={(e) => void onSubmitHostel(e)}
            onClick={(e) => e.stopPropagation()}
            style={modalFormStyle}
          >
            <h2 style={{ margin: 0, color: brand.navy, fontSize: 20 }}>
              {hostelFormMode.kind === 'create' ? 'Add hostel' : 'Edit hostel'}
            </h2>

            <label style={{ ...labelStyle, marginTop: 20 }}>
              Name
              <input
                required
                value={hostelForm.name}
                onChange={(e) => setHostelForm({ name: e.target.value })}
                style={inputStyle}
              />
            </label>

            {hostelFormError ? (
              <p style={{ color: palette.error, fontSize: 13, marginTop: 14 }}>{hostelFormError}</p>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={closeHostelForm} disabled={hostelSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={hostelSubmitting}>
                {hostelSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {roomFormMode ? (
        <div style={modalOverlayStyle} onClick={closeRoomForm}>
          <form
            onSubmit={(e) => void onSubmitRoom(e)}
            onClick={(e) => e.stopPropagation()}
            style={modalFormStyle}
          >
            <h2 style={{ margin: 0, color: brand.navy, fontSize: 20 }}>
              {roomFormMode.kind === 'create' ? 'Add room' : 'Edit room'}
            </h2>

            <label style={{ ...labelStyle, marginTop: 20 }}>
              Number
              <input
                required
                value={roomForm.number}
                onChange={(e) => setRoomForm((f) => ({ ...f, number: e.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Capacity (optional)
              <input
                type="number"
                min={1}
                value={roomForm.capacity}
                onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))}
                style={inputStyle}
              />
            </label>

            {roomFormError ? (
              <p style={{ color: palette.error, fontSize: 13, marginTop: 14 }}>{roomFormError}</p>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={closeRoomForm} disabled={roomSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={roomSubmitting}>
                {roomSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: palette.textPrimary,
};

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  height: 40,
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box',
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

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7,26,51,0.45)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 50,
  padding: 24,
};

const modalFormStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 16,
  padding: 28,
  boxShadow: '0 8px 32px rgba(7,26,51,0.2)',
};
