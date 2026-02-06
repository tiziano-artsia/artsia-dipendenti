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
