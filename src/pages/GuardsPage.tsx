import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import {
  guardsApi,
  type CreateGuardBody,
  type Guard,
  type UpdateGuardBody,
} from '../lib/guards.api';

const PAGE_SIZE = 20;

type FormMode = { kind: 'create' } | { kind: 'edit'; guard: Guard };

interface GuardFormState {
  name: string;
  email: string;
  employeeId: string;
  hostelId: string;
  shift: string;
}

function emptyForm(): GuardFormState {
  return { name: '', email: '', employeeId: '', hostelId: '', shift: '' };
}

function formFromGuard(guard: Guard): GuardFormState {
  return {
    name: guard.name,
    email: guard.email,
    employeeId: guard.employeeId,
    // The list/detail response only exposes the hostel *name*, not the
    // hostelId itself, so this can't be pre-filled — left blank unless changed.
    hostelId: '',
    shift: guard.shift ?? '',
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function GuardsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<GuardFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['guards', page, PAGE_SIZE, search],
    queryFn: () => guardsApi.list({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateGuardBody) => guardsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guards'] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateGuardBody }) =>
      guardsApi.update(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guards'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => guardsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guards'] });
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't delete this guard. Please try again."));
    },
  });

  const openCreateForm = () => {
    setForm(emptyForm());
    setFormError(null);
    setFormMode({ kind: 'create' });
  };

  const openEditForm = (guard: Guard) => {
    setForm(formFromGuard(guard));
    setFormError(null);
    setFormMode({ kind: 'edit', guard });
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError(null);
  };

  const onDelete = (guard: Guard) => {
    if (!window.confirm(`Remove ${guard.name} (${guard.employeeId})? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(guard.id);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formMode) return;

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          employeeId: form.employeeId.trim(),
          hostelId: form.hostelId.trim() || undefined,
          shift: form.shift.trim() || undefined,
        });
      } else {
        await updateMutation.mutateAsync({
          id: formMode.guard.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            hostelId: form.hostelId.trim() || undefined,
            shift: form.shift.trim() || undefined,
          },
        });
      }
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: TableColumn<Guard>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'employeeId', header: 'Employee ID', render: (row) => row.employeeId },
    { key: 'hostel', header: 'Hostel', render: (row) => row.hostelName ?? '—' },
    {
      key: 'shift',
      header: 'Shift',
      render: (row) => (row.shift ? <Badge variant="neutral">{row.shift}</Badge> : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" style={{ height: 32, padding: '0 12px' }} onClick={() => openEditForm(row)}>
            Edit
          </Button>
          <Button
            variant="danger"
            style={{ height: 32, padding: '0 12px' }}
            onClick={() => onDelete(row)}
            disabled={deleteMutation.isPending}
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
          <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Guards</h1>
          <p style={{ color: palette.textMuted, marginTop: 8 }}>
            Manage the security guards provisioned for your organization.
          </p>
        </div>
        <Button onClick={openCreateForm}>Add guard</Button>
      </div>

      <div style={{ marginTop: 24 }}>
        <input
          type="search"
          placeholder="Search by name, email, or employee ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading guards…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load guards. Please try again shortly.
            </p>
          ) : (
            <>
              <Table
                columns={columns}
                rows={data?.guards ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No guards found."
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
                  {total} guard{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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

      {formMode ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7,26,51,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: 24,
          }}
          onClick={closeForm}
        >
          <form
            onSubmit={(e) => void onSubmit(e)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 8px 32px rgba(7,26,51,0.2)',
            }}
          >
            <h2 style={{ margin: 0, color: brand.navy, fontSize: 20 }}>
              {formMode.kind === 'create' ? 'Add guard' : 'Edit guard'}
            </h2>

            <label style={{ ...labelStyle, marginTop: 20 }}>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Employee ID
              <input
                required
                disabled={formMode.kind === 'edit'}
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                style={{
                  ...inputStyle,
                  background: formMode.kind === 'edit' ? palette.surfaceVariant : palette.surface,
                }}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Hostel ID (optional)
              <input
                value={form.hostelId}
                onChange={(e) => setForm((f) => ({ ...f, hostelId: e.target.value }))}
                style={inputStyle}
                placeholder="Leave blank if not assigned yet"
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Shift (optional)
              <input
                value={form.shift}
                onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. Day, Night"
              />
            </label>

            {formError ? (
              <p style={{ color: palette.error, fontSize: 13, marginTop: 14 }}>{formError}</p>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
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
