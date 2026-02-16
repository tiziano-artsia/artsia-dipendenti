import './globals.css';
import type { Metadata, Viewport } from "next";
import { CapacitorInitializer } from "@/components/CapacitorInitializer";
import { SWRegistration } from "@/components/SWRegistration";

export const metadata: Metadata = {
    title: 'Artsia',
    description: 'Sistema di gestione dipendenti Artsia',
    applicationName: 'Artsia Dipendenti',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Artsia',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        apple: '/apple-touch-icon.png',
    },
};

// ✅ Separa viewport e themeColor
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#662D87',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it">
        <head>
            {/* Rimosso meta viewport perché già gestito da export viewport */}

            {/* PWA */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            {/* iOS Icons */}
            <link rel="apple-touch-icon" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="152x152" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="167x167" href="/logo-artsia.png" />

            {/* Splash Screens iOS */}
            <link rel="apple-touch-startup-image" href="/logo-artsia.png" />

            <meta name="format-detection" content="telephone=no" />
        </head>

        <body className="overflow-x-hidden">
        <SWRegistration />
        <CapacitorInitializer />
        {children}
        </body>
        </html>
    );
}
