import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from './Layouts/AppLayout';

// Ensure all axios requests include cookies (jwt_token) for API auth.
// This must run before any page component makes API calls.
axios.defaults.withCredentials = true;

createInertiaApp({
    title: (title) => (title ? `${title} - ${import.meta.env.VITE_APP_NAME ?? 'Campaign Pro X'}` : 'Campaign Pro X'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) {
            console.error(`Inertia page not found: ${name}`);
            throw new Error(`Page not found: ${name}`);
        }
        // Auth pages don't use the app layout (they're full-screen)
        if (name.startsWith('Auth/')) {
            return page;
        }
        // All other pages get wrapped in AppLayout
        return {
            ...page,
            default: (props) => (
                <AppLayout>
                    <page.default {...props} />
                </AppLayout>
            ),
        };
    },
    setup: ({ el, App, props }) => {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4f46e5',
        includeCSS: true,
        showSpinner: false,
    },
});
