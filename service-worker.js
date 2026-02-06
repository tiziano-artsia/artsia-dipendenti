import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: false,
    runtimeCaching: defaultCache,
});

// Handler per Push Notifications
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push ricevuta:', event);

    if (!event.data) {
        console.log('[Service Worker] Push senza dati');
        return;
    }

    try {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/dashboard',
                requestId: data.requestId,
                type: data.type,
                dateTime: new Date().toISOString()
            },
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
            tag: data.tag || `artsia-${data.type || 'notification'}`,
            timestamp: Date.now()
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (error) {
        console.error('[Service Worker] Errore parsing push:', error);
    }
});

// Handler per Click su Notifica
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notifica cliccata:', event);

    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Se l'app è già aperta in una tab, portala in primo piano
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    const clientUrl = new URL(client.url).pathname;
                    const targetUrl = new URL(urlToOpen).pathname;

                    if (clientUrl === targetUrl && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Se c'è già una finestra aperta, naviga lì
                if (clientList.length > 0) {
                    return clientList[0].focus().then(client => {
                        return client.navigate(urlToOpen);
                    });
                }

                // Altrimenti apri una nuova finestra
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('notificationclose', function(event) {
    console.log('[Service Worker] Notifica chiusa:', event.notification.tag);
});

self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    try {
        console.log('[Service Worker] Sync notifiche');
    } catch (error) {
        console.error('[Service Worker] Errore sync:', error);
    }
}

serwist.addEventListeners();
