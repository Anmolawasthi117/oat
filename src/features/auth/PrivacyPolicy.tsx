import { motion } from 'framer-motion';
import { APP } from '../../config/constants';
import { springs } from '../../config/theme';

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen py-20 px-6 max-w-3xl mx-auto">
            <motion.h1
                className="text-5xl mb-8"
                style={{ fontFamily: 'var(--font-heading)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={springs.gentle}
            >
                Privacy Policy
            </motion.h1>

            <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--color-espresso)', opacity: 0.9 }}>
                <section>
                    <h2 className="text-xl mb-4 font-semibold">1. Introduction</h2>
                    <p>
                        Welcome to {APP.NAME} ("we", "us", or "our"). We are committed to protecting your personal information and your right to privacy.
                        {APP.NAME} is designed as a local-first application, meaning your data is processed on your device.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-4 font-semibold">2. Data Processing (Local-First)</h2>
                    <p>
                        <strong>Biometric Data:</strong> All facial detection and recognition processing happens entirely within your web browser on your local device. 
                        We do not transmit, store, or receive your facial descriptors or biometric data on any external servers.
                    </p>
                    <p className="mt-4">
                        <strong>Photos:</strong> When you select photos for scanning, they are processed locally. Your original photos never leave your device unless you choose to export them to a third-party service like Google Drive.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-4 font-semibold">3. Information We Collect (Google OAuth)</h2>
                    <p>
                        When you sign in with Google, we may access certain information to provide our services:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li><strong>Basic Profile Info:</strong> We use your Google account information only for authentication purposes.</li>
                        <li><strong>Google Drive Scopes:</strong> We request <code>drive.readonly</code> and <code>drive.file</code> permissions specifically to allow YOU to select folders for scanning and to upload matched photos back to YOUR Drive. This data is streamed directly to your browser and is not stored by us.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl mb-4 font-semibold">4. Data Storage</h2>
                    <p>
                        We use the <strong>Origin Private File System (OPFS)</strong> and <strong>IndexedDB</strong> in your browser to temporarily store images and metadata for processing. 
                        This data is sandboxed to your browser and is deleted when you clear your browser data or use the "Clear Data" feature in the app.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl mb-4 font-semibold">5. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at anmolawasthi117@gmail.com.
                    </p>
                </section>
            </div>
        </div>
    );
}
