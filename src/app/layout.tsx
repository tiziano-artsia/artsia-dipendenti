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
            <meta name="mobile-web-app-capable" content="yes" />
        </head>

        <body>
        <NotificationSound />
        {children}</body>
        </html>
    );
}
