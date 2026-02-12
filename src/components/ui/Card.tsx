import { type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Card Component — Floating pebble or polaroid style
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'polaroid';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, variant = 'default', children, ...props }, ref) => {
    const baseStyles = variant === 'polaroid'
      ? 'polaroid'
      : 'float-card p-8';

    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          hover && 'transition-smooth cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/**
 * Card Header
 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * Card Title
 */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx('text-2xl', className)}
      style={{
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-espresso)',
        fontWeight: 400,
      }}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * Card Content
 */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(className)}
      style={{ color: 'var(--color-warm-grey)' }}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';
