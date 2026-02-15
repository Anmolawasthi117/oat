import { APP } from '../../config/constants';

/**
 * Footer — Minimal, warm, always at the bottom.
 */

export function Footer() {
    return (
        <footer
            style={{
                padding: '1.5rem 1.5rem',
                textAlign: 'center',
                borderTop: '1px solid rgba(224, 201, 166, 0.2)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'var(--color-warm-grey)',
                letterSpacing: '-0.01em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>☕</span>
                <span>
                    {APP.NAME} · {APP.TAGLINE}
                </span>
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                All processing happens on your device · Your photos never leave your browser
            </div>
        </footer>
    );
}
