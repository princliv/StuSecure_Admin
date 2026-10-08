import type { ButtonHTMLAttributes } from 'react';
import { brand, palette } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, { background: string; color: string; border: string }> = {
  primary: { background: `var(--org-accent, ${brand.blue})`, color: '#fff', border: '0' },
  secondary: { background: palette.surface, color: palette.textPrimary, border: `1px solid ${palette.border}` },
  danger: { background: palette.error, color: '#fff', border: '0' },
};

export default function Button({ variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        height: 40,
        padding: '0 16px',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        background: styles.background,
        color: styles.color,
        border: styles.border,
        ...style,
      }}
      {...rest}
    />
  );
}
