'use client'
import { useEffect } from 'react';

export function SWRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });

                await navigator.serviceWorker.ready;
                console.log('✅ SW pronto');

                // ← AGGIUNGI QUESTO
                await subscribeWebPush(registration);

            } catch (error) {
                console.error('❌ Errore SW:', error);
            }
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NEW_NOTIFICATION') {
                window.dispatchEvent(new CustomEvent('sw-notification', {
                    detail: event.data.notification
                }));
            }
        });

    }, []);

    return null;
}

async function subscribeWebPush(registration: ServiceWorkerRegistration) {
    try {
        if (!('PushManager' in window)) return;

        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) {
            console.warn('⚠️ JWT non trovato, skip subscribe');
            return;
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
        }

        // Se già sottoscritto non rifare
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            console.log('✅ Già sottoscritto');
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // @ts-ignore
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            )
        });

        // ← body wrappato in { subscription: ... } come si aspetta il tuo endpoint
        const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ subscription })  // ← chiave "subscription"
        });

        const data = await res.json();
        if (res.ok) {
            console.log('✅ Web push subscription salvata:', data.subscriptionId);
        } else {
            console.error('❌ Errore:', data.error);
        }

    } catch (error) {
        console.error('❌ Errore subscribe web push:', error);
    }
}



function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
