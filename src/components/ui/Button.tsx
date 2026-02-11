import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

/**
 * Button Component - Following OAT's pebble aesthetic
 */

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'hover:opacity-90',
        secondary: 'hover:opacity-90',
        destructive: 'text-white hover:opacity-90',
        ghost: 'bg-transparent hover:bg-[var(--color-paper)]',
        outline: 'border-2 hover:bg-[var(--color-paper)]',
      },
      size: {
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
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
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    // Get background color based on variant
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: 'var(--color-matcha)',
            color: 'var(--color-espresso)',
            borderRadius: '1.75rem',
          };
        case 'secondary':
          return {
            backgroundColor: 'var(--color-clay)',
            color: 'var(--color-espresso)',
            borderRadius: '1.75rem',
          };
        case 'destructive':
          return {
            backgroundColor: 'var(--color-berry)',
            borderRadius: '1.75rem',
          };
        case 'outline':
          return {
            borderColor: 'var(--color-espresso)',
            color: 'var(--color-espresso)',
            borderRadius: '1.75rem',
          };
        default:
          return { borderRadius: '1.75rem' };
      }
    };

    return (
      <button
        ref={ref}
        className={clsx(buttonVariants({ variant, size }), className)}
        style={getVariantStyles()}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
