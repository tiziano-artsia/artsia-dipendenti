// app/layout.tsx corretto
import './globals.css';
import type { Metadata, Viewport } from "next";
import { CapacitorInitializer } from "@/components/CapacitorInitializer";
import { SWRegistration } from "@/components/SWRegistration";
import {Toaster} from "react-hot-toast";

export const metadata: Metadata = {
    title: 'Artsia',
    description: 'Sistema di gestione dipendenti Artsia',
    applicationName: 'Artsia Dipendenti',
    manifest: '/manifest.json',
    category: 'productivity',
    themeColor: '#662D87',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Artsia',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: '/icons/logo-artsia.png',
        shortcut: '/icons/logo-artsia.png',
        apple: '/icons/logo-artsia.png',
        other: [
            {
                rel: 'mask-icon',
                url: '/icons/logo-artsia.png',
                color: '#662D87',
            },
        ],
    },
};

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
            {/* PWA iOS */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Artsia" />

            {/* PWA ANDROID */}
            <meta name="theme-color" content="#662D87" />
            <meta name="msapplication-TileColor" content="#662D87" />
            <meta name="msapplication-navbutton-color" content="#662D87" />
            <meta name="msapplication-starturl" content="/" />
            <meta name="display" content="standalone" />

            {/* iOS Icons - CORRETTO: senza /public/ */}
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="152x152" href="/icons/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="120x120" href="/icons/logo-artsia.png" />
            <link rel="apple-touch-icon" sizes="76x76" href="/icons/logo-artsia.png" />
            <link rel="apple-touch-startup-image" href="/icons/logo-artsia.png"
                  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
            <link rel="apple-touch-startup-image" href="/icons/logo-artsia.png"
                  media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />

            {/* Android Icons */}
            <link rel="icon" type="image/png" sizes="192x192" href="/icons/logo-artsia.png" />
            <link rel="icon" type="image/png" sizes="512x512" href="/icons/logo-artsia.png" />
        </head>

        <body className="overflow-x-hidden">
        <SWRegistration />
        <CapacitorInitializer />
        {children}
        </body>
        </html>
    );
}
