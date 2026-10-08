import type { CSSProperties, ReactNode } from 'react';
import { palette } from '../theme';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Card({ title, children, style }: CardProps) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 8px 32px rgba(7,26,51,0.06)',
        ...style,
      }}
    >
      {title ? (
        <p style={{ margin: '0 0 16px', color: palette.textPrimary, fontWeight: 600, fontSize: 16 }}>
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}
