/**
 * OAT Design System - Theme Configuration
 * "The Breakfast Palette" - Warm, organic, and calm
 */

export const colors = {
    // Primary Palette
    oatCream: '#FDFBF7',    // Main background - warm off-white
    paper: '#F5F2EB',       // Cards/surfaces
    espresso: '#3C2F2F',    // Primary text - deep warm brown
    warmGrey: '#8C8580',    // Secondary text
    matcha: '#C3D9C3',      // Primary action/success - soft green
    clay: '#E0C9A6',        // Secondary action - earthy beige
    berry: '#D48C95',       // Destructive/error - muted red
} as const;

export const typography = {
    fontFamily: {
        heading: '"Instrument Serif", serif',
        body: '"Geist Sans", sans-serif',
    },
    fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem',      // 48px
    },
} as const;

export const borderRadius = {
    sm: '0.5rem',      // 8px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
    xl: '2rem',        // 32px
    pebble: '1.75rem', // 28px - signature "pebble" shape
    full: '9999px',
} as const;

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
} as const;

// Animation spring configs for Framer Motion
export const springs = {
    // Gentle, organic motion
    gentle: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
    },
    // Snappy, responsive
    snappy: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
    },
    // Bouncy, playful
    bouncy: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 15,
    },
} as const;

export const shadows = {
    sm: '0 1px 2px 0 rgba(60, 47, 47, 0.05)',
    md: '0 4px 6px -1px rgba(60, 47, 47, 0.1), 0 2px 4px -1px rgba(60, 47, 47, 0.06)',
    lg: '0 10px 15px -3px rgba(60, 47, 47, 0.1), 0 4px 6px -2px rgba(60, 47, 47, 0.05)',
    xl: '0 20px 25px -5px rgba(60, 47, 47, 0.1), 0 10px 10px -5px rgba(60, 47, 47, 0.04)',
} as const;
