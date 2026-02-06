self.addEventListener('push', function(event) {
    console.log('🔔 [SW] Push ricevuta:', event);

    if (!event.data) {
        console.warn('⚠️ [SW] Push senza dati');
        return;
    }

    try {
        const data = event.data.json();
        console.log('📦 [SW] Dati push:', data);

        const options = {
            body: data.body || 'Hai una nuova notifica',
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/badge-72x72.png',
            tag: data.data?.notificationId || 'notification-' + Date.now(),
            requireInteraction: true, // ✅ Rimane finché non viene cliccata
            vibrate: [300, 100, 300, 100, 300], // ✅ Pattern vibrazione mobile
            silent: false, // ✅ NON silenziosa
            renotify: true, // ✅ Rinotifica se stessa tag esiste
            timestamp: Date.now(), // ✅ Timestamp corrente
            data: {
                url: data.data?.url || '/dashboard',
                notificationId: data.data?.notificationId,
                type: data.data?.type,
                timestamp: Date.now()
            },
            // ✅ ACTIONS per interazione
            actions: [
                {
                    action: 'open',
                    title: 'Apri'
                },
                {
                    action: 'close',
                    title: 'Chiudi'
                }
            ]
        };

        console.log('🔔 [SW] Mostra notifica con options:', options);

        event.waitUntil(
            self.registration.showNotification(data.title || 'Notifica', options)
                .then(() => {
                    console.log('✅ [SW] Notifica mostrata con successo');

                    return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'PLAY_SOUND'
                                });
                            });
                        });
                })
        );
    } catch (error) {
        console.error('❌ [SW] Errore parsing push:', error);
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('👆 [SW] Click su notifica:', event.notification.tag);
    console.log('👆 [SW] Action:', event.action);

    event.notification.close();

    // Gestisci azioni
    if (event.action === 'close') {
        console.log('🔔 [SW] Notifica chiusa');
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard';
    console.log('🔗 [SW] Apertura URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if ('focus' in client) {
                        return client.focus().then(() => {
                            return client.navigate(urlToOpen);
                        });
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('install', function(event) {
    console.log('⚙️ [SW] Service Worker installato');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('✅ [SW] Service Worker attivato');
    event.waitUntil(clients.claim());
});
// public/sw.js - VERSIONE COMPLETA FINALE

const CACHE_NAME = 'artsia-v1';
const urlsToCache = [
    '/',
    '/dashboard',
    '/logo-artsia.png',
    '/maskable_icon.png'
];

// ✅ INSTALL
self.addEventListener('install', function(event) {
    console.log('⚙️ [SW] Service Worker installato');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 [SW] Cache aperta');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// ✅ ACTIVATE
self.addEventListener('activate', function(event) {
    console.log('✅ [SW] Service Worker attivato');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ [SW] Rimozione cache vecchia:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

// ✅ FETCH - Network first con cache fallback
self.addEventListener('fetch', function(event) {
    // Ignora richieste non-GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clona per cache
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Fallback alla cache se offline
                return caches.match(event.request);
            })
    );
});

// ✅ PUSH NOTIFICATION
self.addEventListener('push', function(event) {
    console.log('🔔 [SW] Push ricevuta:', event);

    if (!event.data) {
        console.warn('⚠️ [SW] Push senza dati');
        return;
    }

    try {
        const data = event.data.json();
        console.log('📦 [SW] Dati push:', data);

        const options = {
            body: data.body || 'Hai una nuova notifica',
            icon: data.icon || '/logo-artsia.png',
            badge: data.badge || '/logo-artsia.png',
            tag: 'notification-' + Date.now(), // ✅ Tag unico per iOS
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            silent: false, // ✅ Usa suono di sistema
            renotify: true,
            timestamp: Date.now(),
            data: {
                url: data.data?.url || '/dashboard',
                notificationId: data.data?.notificationId,
                type: data.data?.type
            },
            actions: [
                {
                    action: 'open',
                    title: '👀 Apri'
                },
                {
                    action: 'close',
                    title: '✖️ Chiudi'
                }
            ]
        };

        console.log('🔔 [SW] Mostra notifica con options:', options);

        event.waitUntil(
            self.registration.showNotification(data.title || 'Artsia', options)
                .then(() => {
                    console.log('✅ [SW] Notifica mostrata');

                    // Invia messaggio ai client per suono custom
                    return self.clients.matchAll({
                        type: 'window',
                        includeUncontrolled: true
                    }).then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'PLAY_SOUND',
                                notification: data
                            });
                        });
                    });
                })
        );
    } catch (error) {
        console.error('❌ [SW] Errore parsing push:', error);
    }
});

//  NOTIFICATION CLICK
self.addEventListener('notificationclick', function(event) {

    event.notification.close();

    // Se ha cliccato "Chiudi"
    if (event.action === 'close') {
        console.log('🔔 [SW] Notifica chiusa');
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard';
    console.log('🔗 [SW] Apertura URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Se c'è già una finestra aperta
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    return client.focus().then(() => {
                        if ('navigate' in client) {
                            return client.navigate(urlToOpen);
                        }
                    });
                }
            }
            // Altrimenti apri nuova finestra
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});





