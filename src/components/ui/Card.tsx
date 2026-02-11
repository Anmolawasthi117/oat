import { type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Card Component - Pebble-shaped container
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'shadow-md p-6',
          hover && 'transition-transform hover:scale-[1.02] hover:shadow-lg',
          className
        )}
        style={{
          backgroundColor: 'var(--color-paper)',
          borderRadius: '1.75rem',
        }}
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
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('mb-4', className)} {...props} />
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Title
 */
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx('text-2xl font-semibold', className)}
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-espresso)',
        }}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * Card Content
 */
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={clsx(className)} 
        style={{ color: 'var(--color-warm-grey)' }}
        {...props} 
      />
    );
  }
);

CardContent.displayName = 'CardContent';
