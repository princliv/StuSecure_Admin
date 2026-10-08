import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import {
  facultyApi,
  type CreateFacultyBody,
  type Faculty,
  type UpdateFacultyBody,
} from '../lib/faculty.api';

const PAGE_SIZE = 20;

type FormMode = { kind: 'create' } | { kind: 'edit'; faculty: Faculty };

interface FacultyFormState {
  name: string;
  email: string;
  employeeId: string;
  department: string;
}

function emptyForm(): FacultyFormState {
  return { name: '', email: '', employeeId: '', department: '' };
}

function formFromFaculty(faculty: Faculty): FacultyFormState {
  return {
    name: faculty.name,
    email: faculty.email,
    employeeId: faculty.employeeId,
    department: faculty.department ?? '',
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function FacultyPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<FacultyFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faculty', page, PAGE_SIZE, search],
    queryFn: () => facultyApi.list({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateFacultyBody) => facultyApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty'] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateFacultyBody }) =>
      facultyApi.update(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facultyApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't delete this faculty member. Please try again."));
    },
  });

  const openCreateForm = () => {
    setForm(emptyForm());
    setFormError(null);
    setFormMode({ kind: 'create' });
  };

  const openEditForm = (faculty: Faculty) => {
    setForm(formFromFaculty(faculty));
    setFormError(null);
    setFormMode({ kind: 'edit', faculty });
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError(null);
  };

  const onDelete = (faculty: Faculty) => {
    if (!window.confirm(`Remove ${faculty.name} (${faculty.employeeId})? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(faculty.id);
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
          department: form.department.trim() || undefined,
        });
      } else {
        await updateMutation.mutateAsync({
          id: formMode.faculty.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            department: form.department.trim() || undefined,
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

  const columns: TableColumn<Faculty>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'employeeId', header: 'Employee ID', render: (row) => row.employeeId },
    { key: 'department', header: 'Department', render: (row) => row.department ?? '—' },
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
          <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Faculty</h1>
          <p style={{ color: palette.textMuted, marginTop: 8 }}>
            Manage the faculty members provisioned for your organization.
          </p>
        </div>
        <Button onClick={openCreateForm}>Add faculty</Button>
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
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading faculty…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load faculty. Please try again shortly.
            </p>
          ) : (
            <>
              <Table
                columns={columns}
                rows={data?.faculty ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No faculty found."
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
                  {total} faculty member{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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
              {formMode.kind === 'create' ? 'Add faculty' : 'Edit faculty'}
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
              Department (optional)
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. Computer Science"
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
