import './globals.css';
import type {Metadata} from "next";
import {NotificationSound} from "@/components/NotificationSound";

export const metadata: Metadata = {
    title: 'Artsia',
    description: 'Sistema di gestione dipendenti Artsia',
    applicationName: 'Artsia Dipendenti',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Artsia',
    },
    formatDetection: {
        telephone: false,
    },
    themeColor: '#662D87',
    icons: {
        apple: '/apple-touch-icon.png',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it">
        <head>
            {/* PWA */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Artsia" />

            {/* iOS Icons */}
            <link rel="apple-touch-icon" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="152x152" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="167x167" href="/logo-artsia.png" />

            {/* Splash Screens iOS (opzionale ma consigliato) */}
            <link rel="apple-touch-startup-image" href="/logo-artsia.png" />
        </head>

        <body>
        <NotificationSound />
        {children}
        </body>
        </html>
    );
}
