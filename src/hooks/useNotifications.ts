'use client';

import { useAtom, useSetAtom } from 'jotai';
import {
    notificationsAtom,
    pushPermissionAtom,
    notificationsLoadingAtom,
} from '@/lib/atoms/notificationAtoms';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useNotifications() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [permission, setPermission] = useAtom(pushPermissionAtom);
    const setLoading = useSetAtom(notificationsLoadingAtom);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    // Helper per fetch con autenticazione
    const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers,
        });
    }, [token]);

    // Carica notifiche dal server
    const loadNotifications = useCallback(async () => {
        if (!user || !token) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await authenticatedFetch('/api/notifications');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Errore: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setHasMore(data.hasMore || false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, token, authenticatedFetch, setNotifications, setLoading]);

    // Richiedi permesso e registra subscription
    const requestPermission = useCallback(async () => {

        if (!('Notification' in window)) {
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            return false;
        }

        if (!user || !token) {
        
            return false;
        }

        try {
            // Richiedi permesso
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== 'granted') {
                return false;
            }

            // Attendi che il service worker sia pronto
            const registration = await navigator.serviceWorker.register('/sw.js');

            // Controlla se esiste già una subscription
            let subscription = await registration.pushManager.getSubscription();

            // Se non esiste, creala
            if (!subscription) {
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    //console.erro('❌ VAPID public key mancante nel .env');
                    return false;
                }

                //console.log('🔔 Creando nuova subscription...');

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
                //console.log('✅ Subscription creata');
            }

            // Invia subscription al server
            const subscriptionData = subscription.toJSON();
            //console.log('📤 Inviando subscription al server...');

            const response = await authenticatedFetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                    subscription: subscriptionData
                })
            });

            //console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                //console.erro('❌ Errore response subscribe:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            const responseData = await response.json();
            //console.log('✅ Subscription registrata con successo:', responseData);
            return true;
        } catch (error: any) {
            //console.erro('❌ Errore richiesta permesso:', error);
            return false;
        }
    }, [user, token, authenticatedFetch, setPermission]);

    // Segna singola notifica come letta
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user || !token) {
            console.warn('⚠️ markAsRead: user o token mancante');
            return;
        }

        try {
            //console.log('✅ Segnando come letta:', notificationId);

            const response = await authenticatedFetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                //console.erro('❌ Errore markAsRead:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // Aggiorna stato locale
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            //console.log('✅ Notifica segnata come letta');
        } catch (error) {
            //console.erro('❌ Errore mark as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // Segna tutte come lette
    const markAllAsRead = useCallback(async () => {
        if (!user || !token) {
            console.warn('⚠️ markAllAsRead: user o token mancante');
            return;
        }

        try {
            //console.log('✅ Segnando tutte come lette');

            const response = await authenticatedFetch('/api/notifications/read-all', {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                //console.erro('❌ Errore markAllAsRead:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // Aggiorna stato locale
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            //console.log('✅ Tutte le notifiche segnate come lette');
        } catch (error) {
            //console.erro('❌ Errore mark all as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // Elimina notifica
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user || !token) {
            console.warn('⚠️ deleteNotification: user o token mancante');
            return;
        }

        try {
            //console.log('🗑️ Eliminando notifica:', notificationId);

            const response = await authenticatedFetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                //console.erro('❌ Errore deleteNotification:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // Aggiorna stato locale
            setNotifications(prev => {
                const notification = prev.find(n => n._id === notificationId);
                if (notification && !notification.read) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n._id !== notificationId);
            });
            //console.log('✅ Notifica eliminata');
        } catch (error) {
            //console.erro('❌ Errore delete notification:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // Carica più notifiche (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || !user || !token) return;

        try {
            const offset = notifications.length;
            const response = await authenticatedFetch(`/api/notifications?offset=${offset}`);

            if (response.ok) {
                const data = await response.json();
                setNotifications(prev => [...prev, ...(data.notifications || [])]);
                setHasMore(data.hasMore || false);
            }
        } catch (error) {
            //console.erro('❌ Errore loadMore:', error);
        }
    }, [hasMore, user, token, notifications.length, authenticatedFetch, setNotifications]);

    // Refresh manuale
    const refresh = useCallback(() => {
        //console.log('🔄 Refresh notifiche');
        loadNotifications();
    }, [loadNotifications]);

    // Inizializzazione
    useEffect(() => {
        if (user && token && !hasInitialized.current) {
            hasInitialized.current = true;


            loadNotifications();

            // Se il permesso era già stato concesso, registra la subscription
            if (permission === 'granted') {
                //console.log('🔔 Permesso già concesso, registrando subscription...');
                requestPermission();
            }
        }

        // Reset quando l'utente fa logout
        if ((!user || !token) && hasInitialized.current) {
            //console.log('🔔 Reset notifiche - logout');
            hasInitialized.current = false;
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, token, permission, loadNotifications, requestPermission, setNotifications]);

    // hooks/useNotifications.ts - Versione ottimizzata con SSE

    useEffect(() => {
        if (!user || !token) return;

        let eventSource: EventSource | null = null;

        const connectSSE = () => {
            // Connessione real-time al server
            eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('🔔 Nuova notifica in tempo reale:', data);

                // Aggiorna stato immediatamente
                setNotifications(prev => [data.notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            };

            eventSource.onerror = (error) => {
                console.error('❌ SSE error:', error);
                eventSource?.close();

                // Riconnetti dopo 5 secondi
                setTimeout(connectSSE, 5000);
            };
        };

        connectSSE();

        return () => {
            eventSource?.close();
        };
    }, [user, token]);



    return {
        notifications,
        loading: false,
        error,
        unreadCount,
        hasMore,
        permission,
        requestPermission,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        refresh
    };
}
