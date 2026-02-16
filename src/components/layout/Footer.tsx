import { APP } from '../../config/constants';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import anmolImg from '../../assets/anmol.jpeg';

/**
 * Footer — Minimal, warm, always at the bottom.
 */

export function Footer() {
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);

    return (
        <>
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
                    gap: '0.8rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>☕</span>
                    <span>
                        {APP.NAME} · {APP.TAGLINE}
                    </span>
                </div>
                
                <button
                    onClick={() => setIsDevModalOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        font: 'inherit',
                        cursor: 'pointer',
                        color: 'var(--color-warm-grey)',
                        opacity: 0.8,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                    Created by Anmol
                </button>

                <div style={{ fontSize: '0.7rem', opacity: 0.6, display: 'flex', gap: '1rem' }}>
                    <span>All processing happens on your device</span>
                    <span>·</span>
                    <span>Your photos never leave your browser</span>
                    <span>·</span>
                    <a href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>
                </div>
            </footer>

            <Modal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.2rem',
                    padding: '0.5rem 0 1rem',
                }}>
                    <div className="float-card" style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        padding: '4px',
                        backgroundColor: 'white',
                    }}>
                        <img 
                            src={anmolImg} 
                            alt="Anmol Awasthi" 
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%',
                            }}
                        />
                    </div>

                    <div>
                        <h3 style={{ 
                            fontSize: '1.5rem', 
                            marginBottom: '0.2rem',
                            color: 'var(--color-espresso)'
                        }}>
                            Anmol Awasthi
                        </h3>
                        <p style={{ 
                            margin: 0, 
                            color: 'var(--color-warm-grey)',
                            fontSize: '0.9rem' 
                        }}>
                            Full Stack Developer
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '0.5rem',
                    }}>
                        <a 
                            href="https://github.com/Anmolawasthi117" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                color: 'var(--color-espresso)',
                                transition: 'transform 0.2s, background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                            }}
                            title="GitHub"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                        </a>
                        
                        <a 
                            href="https://www.linkedin.com/in/anmol-awasthi11117/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,119,181,0.1)',
                                color: '#0077b5',
                                transition: 'transform 0.2s, background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,119,181,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,119,181,0.1)';
                            }}
                            title="LinkedIn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                <rect x="2" y="9" width="4" height="12"></rect>
                                <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                        </a>

                        <a 
                            href="mailto:anmolawasthi117@gmail.com" 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(212, 70, 56, 0.1)',
                                color: '#D44638',
                                transition: 'transform 0.2s, background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.backgroundColor = 'rgba(212, 70, 56, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'rgba(212, 70, 56, 0.1)';
                            }}
                            title="Email"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>
            </Modal>
        </>
    );
}
