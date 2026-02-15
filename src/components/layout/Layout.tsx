import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Layout — Wraps pages with Header + Footer.
 * Landing page gets its own full-bleed layout (no header/footer).
 */

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const isLanding = location.pathname === '/';

    if (isLanding) {
        return <>{children}</>;
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <Header />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
