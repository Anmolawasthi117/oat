import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

/**
 * Button Component — Soft, tactile pebble buttons
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        destructive: '',
        ghost: 'bg-transparent',
        outline: 'border-2',
      },
      size: {
        sm: 'px-5 py-2.5 text-sm',
        md: 'px-7 py-3.5 text-base',
        lg: 'px-10 py-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  as?: 'button' | 'span';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, as = 'button', ...props }, ref) => {
    const getStyles = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        borderRadius: 'var(--radius-pebble)',
        boxShadow: 'var(--shadow-float)',
        fontFamily: 'var(--font-body)',
        letterSpacing: '-0.01em',
      };

      switch (variant) {
        case 'primary':
          return { ...base, backgroundColor: 'var(--color-matcha)', color: 'var(--color-espresso)' };
        case 'secondary':
          return { ...base, backgroundColor: 'var(--color-clay)', color: 'var(--color-espresso)' };
        case 'destructive':
          return { ...base, backgroundColor: 'var(--color-berry)', color: 'white' };
        case 'outline':
          return { ...base, borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)', boxShadow: 'none' };
        case 'ghost':
          return { ...base, boxShadow: 'none', color: 'var(--color-espresso)' };
        default:
          return base;
      }
    };

    const Component = as;

    return (
      <Component
        ref={ref as any}
        className={clsx(buttonVariants({ variant, size }), className)}
        style={getStyles()}
        {...(as === 'button' && { disabled: disabled || isLoading })}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </Component>
    );
  }
);
Button.displayName = 'Button';
