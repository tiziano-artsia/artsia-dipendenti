'use client'
import { useEffect } from 'react';

export function SWRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker non supportato');
            return;
        }

        console.group('🔧 REGISTRAZIONE SERVICE WORKER');

        window.addEventListener('load', async () => {
            try {
                console.log('1️⃣ Inizio registrazione SW...');

                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });

                console.log('✅ Service Worker registrato');

                await navigator.serviceWorker.ready;
                console.log('✅ Service Worker attivo e pronto');

                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Aggiornamento SW trovato');
                    const newWorker = registration.installing;

                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            console.log('   Nuovo stato SW:', newWorker.state);
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('✅ Nuovo SW installato');
                            }
                        });
                    }
                });

                console.groupEnd();
            } catch (error) {
                console.error('❌ Errore registrazione SW:', error);
                console.groupEnd();
            }
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('📨 Messaggio da SW:', event.data);

            if (event.data?.type === 'NEW_NOTIFICATION') {
                window.dispatchEvent(new CustomEvent('sw-notification', {
                    detail: event.data.notification
                }));
            }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker controller cambiato');
        });

    }, []);

    return null;
}
