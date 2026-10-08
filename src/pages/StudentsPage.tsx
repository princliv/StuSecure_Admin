import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import {
  studentsApi,
  type CreateStudentBody,
  type Student,
  type UpdateStudentBody,
} from '../lib/students.api';

const PAGE_SIZE = 20;

type FormMode = { kind: 'create' } | { kind: 'edit'; student: Student };

interface StudentFormState {
  name: string;
  email: string;
  enrollmentNo: string;
  phone: string;
  roomId: string;
}

function emptyForm(): StudentFormState {
  return { name: '', email: '', enrollmentNo: '', phone: '', roomId: '' };
}

function formFromStudent(student: Student): StudentFormState {
  return {
    name: student.name,
    email: student.email,
    enrollmentNo: student.enrollmentNo,
    phone: student.phone ?? '',
    // The list/detail response only exposes hostel/room *names*, not the
    // roomId itself, so this can't be pre-filled — left blank unless changed.
    roomId: '',
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error ?? fallback;
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', page, PAGE_SIZE, search],
    queryFn: () => studentsApi.list({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateStudentBody) => studentsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; body: UpdateStudentBody }) =>
      studentsApi.update(args.id, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => {
      window.alert(extractErrorMessage(err, "Couldn't delete this student. Please try again."));
    },
  });

  const openCreateForm = () => {
    setForm(emptyForm());
    setFormError(null);
    setFormMode({ kind: 'create' });
  };

  const openEditForm = (student: Student) => {
    setForm(formFromStudent(student));
    setFormError(null);
    setFormMode({ kind: 'edit', student });
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError(null);
  };

  const onDelete = (student: Student) => {
    if (!window.confirm(`Remove ${student.name} (${student.enrollmentNo})? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(student.id);
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
          enrollmentNo: form.enrollmentNo.trim(),
          phone: form.phone.trim() || undefined,
          roomId: form.roomId.trim() || undefined,
        });
      } else {
        await updateMutation.mutateAsync({
          id: formMode.student.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
            roomId: form.roomId.trim() || undefined,
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

  const columns: TableColumn<Student>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'enrollmentNo', header: 'Enrollment No.', render: (row) => row.enrollmentNo },
    {
      key: 'room',
      header: 'Hostel / Room',
      render: (row) =>
        row.hostelName ? `${row.hostelName}${row.roomNumber ? ` · ${row.roomNumber}` : ''}` : '—',
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone ?? '—' },
    {
      key: 'status',
      header: 'Last activity',
      render: (row) =>
        row.lastMovement ? (
          <Badge variant={row.lastMovement.type === 'CHECK_IN' ? 'success' : 'neutral'}>
            {row.lastMovement.type === 'CHECK_IN' ? 'Checked in' : 'Checked out'}
          </Badge>
        ) : (
          <Badge variant="neutral">No activity</Badge>
        ),
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
          <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Students</h1>
          <p style={{ color: palette.textMuted, marginTop: 8 }}>
            Manage the students provisioned for your organization.
          </p>
        </div>
        <Button onClick={openCreateForm}>Add student</Button>
      </div>

      <div style={{ marginTop: 24 }}>
        <input
          type="search"
          placeholder="Search by name, email, enrollment no., or phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          {isLoading ? (
            <p style={{ color: palette.textMuted, fontSize: 14 }}>Loading students…</p>
          ) : isError ? (
            <p style={{ color: palette.error, fontSize: 14 }}>
              Couldn't load students. Please try again shortly.
            </p>
          ) : (
            <>
              <Table
                columns={columns}
                rows={data?.students ?? []}
                rowKey={(row) => row.id}
                emptyMessage="No students found."
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
                  {total} student{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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
              {formMode.kind === 'create' ? 'Add student' : 'Edit student'}
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
              Enrollment number
              <input
                required
                disabled={formMode.kind === 'edit'}
                value={form.enrollmentNo}
                onChange={(e) => setForm((f) => ({ ...f, enrollmentNo: e.target.value }))}
                style={{
                  ...inputStyle,
                  background: formMode.kind === 'edit' ? palette.surfaceVariant : palette.surface,
                }}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Phone (optional)
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 14 }}>
              Room ID (optional)
              <input
                value={form.roomId}
                onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                style={inputStyle}
                placeholder="Leave blank if not assigned yet"
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
