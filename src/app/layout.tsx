import './globals.css';
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: 'Artsia',
    description: 'Sistema di gestione dipendenti',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Artsia',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it"><head>
            <meta name="application-name" content="Artsia Dipendenti" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Dipendenti" />
            <meta name="description" content="Sistema gestione dipendenti Artsia" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="theme-color" content="#662D87" />

            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />
        </head>
        <body>{children}</body>
        </html>
    );
}
