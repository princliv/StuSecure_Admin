import type { ReactNode } from 'react';
import { palette } from '../theme';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string | number;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export default function Table<T>({ columns, rows, rowKey, emptyMessage = 'No data yet.' }: TableProps<T>) {
  if (rows.length === 0) {
    return <p style={{ color: palette.textMuted, fontSize: 14, margin: 0 }}>{emptyMessage}</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: palette.textMuted,
                borderBottom: `1px solid ${palette.border}`,
                width: col.width,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((col) => (
              <td
                key={col.key}
                style={{
                  padding: '12px',
                  fontSize: 14,
                  color: palette.textPrimary,
                  borderBottom: `1px solid ${palette.border}`,
                }}
              >
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
