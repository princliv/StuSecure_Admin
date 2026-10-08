import { useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brand, palette } from '../theme';
import Card from '../components/Card';
import StatTile from '../components/StatTile';
import Button from '../components/Button';
import Table, { type TableColumn } from '../components/Table';
import { reportsApi, type ReportDay } from '../lib/reports.api';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: isoDate(from), to: isoDate(to) };
}

const dayColumns: TableColumn<ReportDay>[] = [
  { key: 'date', header: 'Date', render: (row) => row.date },
  { key: 'checkIns', header: 'Check-ins', render: (row) => row.checkIns },
  { key: 'checkOuts', header: 'Check-outs', render: (row) => row.checkOuts },
];

export default function ReportsPage() {
  const initial = defaultRange();
  const [fromInput, setFromInput] = useState(initial.from);
  const [toInput, setToInput] = useState(initial.to);
  const [range, setRange] = useState(initial);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'summary', range.from, range.to],
    queryFn: () => reportsApi.summary(range.from, range.to),
  });

  const onLoadReport = () => {
    setRange({ from: fromInput, to: toInput });
  };

  const onExportCsv = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      await reportsApi.downloadMovementsCsv(range.from, range.to);
    } catch {
      setDownloadError("Couldn't export the CSV. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0, color: brand.navy, fontSize: 28 }}>Reports</h1>
      <p style={{ color: palette.textMuted, marginTop: 8 }}>
        Movement summary and CSV export for a date range.
      </p>

      <div style={{ marginTop: 24 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <label style={labelStyle}>
              From
              <input
                type="date"
                value={fromInput}
                max={toInput}
                onChange={(e) => setFromInput(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              To
              <input
                type="date"
                value={toInput}
                min={fromInput}
                onChange={(e) => setToInput(e.target.value)}
                style={inputStyle}
              />
            </label>
            <Button onClick={onLoadReport}>Load report</Button>
            <Button variant="secondary" onClick={() => void onExportCsv()} disabled={downloading}>
              {downloading ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
          {downloadError ? (
            <p style={{ color: palette.error, fontSize: 13, marginTop: 12 }}>{downloadError}</p>
          ) : null}
        </Card>
      </div>

      {isLoading ? (
        <p style={{ color: palette.textMuted, fontSize: 14, marginTop: 24 }}>Loading report…</p>
      ) : isError ? (
        <p style={{ color: palette.error, fontSize: 14, marginTop: 24 }}>
          Couldn't load the report. Please try again shortly.
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
            <StatTile label="Check-ins" value={data.checkIns} />
            <StatTile label="Check-outs" value={data.checkOuts} />
            <StatTile label="Unique students" value={data.uniqueStudents} />
            <StatTile label="Inside" value={data.insideCount} />
            <StatTile label="Outside" value={data.outsideCount} />
          </div>

          <div style={{ marginTop: 24 }}>
            <Card title="Daily activity">
              <Table
                columns={dayColumns}
                rows={data.byDay}
                rowKey={(row) => row.date}
                emptyMessage="No movement activity in this range."
              />
            </Card>
          </div>
        </>
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
  background: palette.surface,
};
