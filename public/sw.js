// public/sw.js
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || '',
        tag: 'artsia-notification',
        // usa icone di default se non passate
        icon: data.icon || '/icons/logo-artsia.png',
        badge: data.badge || '/icons/badge.png',
        vibrate: [200, 100, 200],
        actions: [
            { action: 'view', title: 'Vedi' },
            { action: 'dismiss', title: 'Chiudi' }
        ],
        requireInteraction: false,
        silent: false,
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Artsia', options)
    );
});

// Click sulla notifica
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});