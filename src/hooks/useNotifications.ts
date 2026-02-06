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
            console.log('⚠️ loadNotifications: user o token mancante');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('🔔 Caricamento notifiche...');

            const response = await authenticatedFetch('/api/notifications');
            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Errore response:', errorData);
                throw new Error(`Errore: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Notifiche caricate:', data);

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setHasMore(data.hasMore || false);
        } catch (err: any) {
            console.error('❌ Errore caricamento notifiche:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, token, authenticatedFetch, setNotifications, setLoading]);

    // Richiedi permesso e registra subscription
    const requestPermission = useCallback(async () => {
        console.log('🔔 requestPermission chiamato');

        if (!('Notification' in window)) {
            console.warn('⚠️ Browser non supporta notifiche');
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Browser non supporta service worker');
            return false;
        }

        if (!user || !token) {
            console.warn('⚠️ Utente non autenticato', {
                hasUser: !!user,
                hasToken: !!token
            });
            return false;
        }

        try {
            // Richiedi permesso
            console.log('🔔 Richiedendo permesso notifiche...');
            const result = await Notification.requestPermission();
            console.log('🔔 Permesso ricevuto:', result);
            setPermission(result);

            if (result !== 'granted') {
                console.log('⚠️ Permesso notifiche negato');
                return false;
            }

            // Attendi che il service worker sia pronto
            console.log('🔔 Attendendo service worker...');
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service worker pronto:', registration.scope);

            // Controlla se esiste già una subscription
            let subscription = await registration.pushManager.getSubscription();
            console.log('🔔 Subscription esistente:', !!subscription);

            // Se non esiste, creala
            if (!subscription) {
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    console.error('❌ VAPID public key mancante nel .env');
                    return false;
                }

                console.log('🔔 Creando nuova subscription...');

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
                console.log('✅ Subscription creata');
            }

            // Invia subscription al server
            const subscriptionData = subscription.toJSON();
            console.log('📤 Inviando subscription al server...');

            const response = await authenticatedFetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({
                    subscription: subscriptionData
                })
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Errore response subscribe:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            const responseData = await response.json();
            console.log('✅ Subscription registrata con successo:', responseData);
            return true;
        } catch (error: any) {
            console.error('❌ Errore richiesta permesso:', error);
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
            console.log('✅ Segnando come letta:', notificationId);

            const response = await authenticatedFetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Errore markAsRead:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // Aggiorna stato locale
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            console.log('✅ Notifica segnata come letta');
        } catch (error) {
            console.error('❌ Errore mark as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // Segna tutte come lette
    const markAllAsRead = useCallback(async () => {
        if (!user || !token) {
            console.warn('⚠️ markAllAsRead: user o token mancante');
            return;
        }

        try {
            console.log('✅ Segnando tutte come lette');

            const response = await authenticatedFetch('/api/notifications/read-all', {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Errore markAllAsRead:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // Aggiorna stato locale
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            console.log('✅ Tutte le notifiche segnate come lette');
        } catch (error) {
            console.error('❌ Errore mark all as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // Elimina notifica
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user || !token) {
            console.warn('⚠️ deleteNotification: user o token mancante');
            return;
        }

        try {
            console.log('🗑️ Eliminando notifica:', notificationId);

            const response = await authenticatedFetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Errore deleteNotification:', error);
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
            console.log('✅ Notifica eliminata');
        } catch (error) {
            console.error('❌ Errore delete notification:', error);
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
            console.error('❌ Errore loadMore:', error);
        }
    }, [hasMore, user, token, notifications.length, authenticatedFetch, setNotifications]);

    // Refresh manuale
    const refresh = useCallback(() => {
        console.log('🔄 Refresh notifiche');
        loadNotifications();
    }, [loadNotifications]);

    // Inizializzazione
    useEffect(() => {
        if (user && token && !hasInitialized.current) {
            hasInitialized.current = true;
            console.log('🔔 Inizializzazione notifiche per utente:', {
                userId: user.id,
                userName: user.name
            });

            loadNotifications();

            // Se il permesso era già stato concesso, registra la subscription
            if (permission === 'granted') {
                console.log('🔔 Permesso già concesso, registrando subscription...');
                requestPermission();
            }
        }

        // Reset quando l'utente fa logout
        if ((!user || !token) && hasInitialized.current) {
            console.log('🔔 Reset notifiche - logout');
            hasInitialized.current = false;
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, token, permission, loadNotifications, requestPermission, setNotifications]);

    // Polling per nuove notifiche (ogni 30 secondi)
    useEffect(() => {
        if (!user || !token) return;

        console.log('🔔 Avvio polling notifiche (ogni 30s)');

        const interval = setInterval(() => {
            console.log('🔔 Polling notifiche...');
            loadNotifications();
        }, 30000); // 30 secondi

        return () => {
            console.log('🔔 Stop polling notifiche');
            clearInterval(interval);
        };
    }, [user, token, loadNotifications]);

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
