import type { ReactNode } from 'react';
import { palette } from '../theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

const variantStyles: Record<BadgeVariant, { background: string; color: string }> = {
  success: { background: '#dcf5e3', color: '#0f7a3d' },
  warning: { background: '#fdf0d5', color: '#8a5a00' },
  error: { background: palette.errorContainer, color: palette.error },
  neutral: { background: palette.surfaceVariant, color: palette.textMuted },
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        background: styles.background,
        color: styles.color,
      }}
    >
      {children}
    </span>
  );
}
