import { brand, palette } from '../theme';

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 32px rgba(7,26,51,0.06)',
      }}
    >
      <p style={{ margin: 0, color: palette.textMuted, fontSize: 13, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '8px 0 0', color: brand.navy, fontSize: 28, fontWeight: 700 }}>{value}</p>
      {hint ? (
        <p style={{ margin: '4px 0 0', color: palette.textMuted, fontSize: 12 }}>{hint}</p>
      ) : null}
    </div>
  );
}
