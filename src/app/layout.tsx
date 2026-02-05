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
        <html lang="it">
        <body>{children}</body>
        </html>
    );
}
