import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { APP } from '../../config/constants';
import { cleanupSession } from '../../utils/cleanup';

/**
 * Header — Sticky top bar with OAT logo, stepper breadcrumb, and user badge.
 * Follows the warm "Breakfast Palette" aesthetic.
 */

const STEPS = [
    { path: '/calibration', label: 'Calibrate', icon: '📷', num: 1 },
    { path: '/ingestion', label: 'Drop Photos', icon: '📁', num: 2 },
    { path: '/processing', label: 'Scanning', icon: '🔍', num: 3 },
    { path: '/results', label: 'Results', icon: '✨', num: 4 },
];

export function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, authMode } = useAuthStore();

    const currentStepIdx = STEPS.findIndex((s) => s.path === location.pathname);

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'rgba(253, 251, 247, 0.85)',
                borderBottom: '1px solid rgba(224, 201, 166, 0.3)',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                }}
            >
                {/* Logo */}
                <motion.button
                    onClick={async () => {
                        await cleanupSession();
                        navigate('/');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>🥣</span>
                    <span
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.5rem',
                            color: 'var(--color-espresso)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {APP.NAME}
                    </span>
                </motion.button>

                {/* Stepper — only show when on a step page */}
                {currentStepIdx >= 0 && (
                    <nav
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flex: 1,
                            justifyContent: 'center',
                            maxWidth: '600px',
                        }}
                    >
                        {STEPS.map((step, i) => {
                            const isCurrent = i === currentStepIdx;
                            const isCompleted = i < currentStepIdx;
                            const isClickable = isCompleted;

                            return (
                                <div key={step.path} style={{ display: 'flex', alignItems: 'center' }}>
                                    <motion.button
                                        onClick={() => isClickable && navigate(step.path)}
                                        whileHover={isClickable ? { scale: 1.08 } : {}}
                                        whileTap={isClickable ? { scale: 0.95 } : {}}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: 'var(--radius-pebble)',
                                            border: 'none',
                                            cursor: isClickable ? 'pointer' : 'default',
                                            background: isCurrent
                                                ? 'var(--color-matcha)'
                                                : isCompleted
                                                    ? 'rgba(214, 230, 208, 0.4)'
                                                    : 'transparent',
                                            color: isCurrent || isCompleted
                                                ? 'var(--color-espresso)'
                                                : 'var(--color-warm-grey)',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.8rem',
                                            fontWeight: isCurrent ? 600 : 400,
                                            transition: 'all 0.2s ease',
                                            opacity: !isCurrent && !isCompleted ? 0.5 : 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.85rem' }}>
                                            {isCompleted ? '✓' : step.icon}
                                        </span>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </motion.button>

                                    {/* Connector line */}
                                    {i < STEPS.length - 1 && (
                                        <div
                                            style={{
                                                width: '1.5rem',
                                                height: '2px',
                                                background: isCompleted
                                                    ? 'var(--color-sage)'
                                                    : 'var(--color-clay)',
                                                opacity: isCompleted ? 0.8 : 0.3,
                                                borderRadius: '1px',
                                                margin: '0 0.15rem',
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                )}

                {/* User badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexShrink: 0,
                    }}
                >
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt=""
                            style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                border: '2px solid var(--color-clay)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                background: authMode === 'guest'
                                    ? 'var(--color-clay)'
                                    : 'var(--color-matcha)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                color: 'var(--color-espresso)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            {user?.displayName?.[0]?.toUpperCase() || '👤'}
                        </div>
                    )}
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-warm-grey)',
                            fontFamily: 'var(--font-body)',
                        }}
                        className="hidden md:inline"
                    >
                        {authMode === 'guest' ? 'Guest' : user?.displayName?.split(' ')[0] || 'User'}
                    </span>
                </div>
            </div>
        </header>
    );
}
