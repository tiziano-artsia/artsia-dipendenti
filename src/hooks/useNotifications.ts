// hooks/useNotifications.ts - VERSIONE CORRETTA

'use client';

import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import {
    notificationsAtom,
    pushPermissionAtom,
    notificationsLoadingAtom,
    unreadCountAtom
} from '@/lib/atoms/notificationAtoms';
import { useEffect, useCallback, useRef } from 'react';
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

function playNotificationSound() {
    try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('⚠️ Errore riproduzione suono:', err));
    } catch (error) {
        console.warn('⚠️ Audio non disponibile');
    }
}

export function useNotifications() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [permission, setPermission] = useAtom(pushPermissionAtom);
    const unreadCount = useAtomValue(unreadCountAtom); // ✅ Solo lettura
    const setLoading = useSetAtom(notificationsLoadingAtom);
    const hasInitialized = useRef(false);
    const previousUnreadCount = useRef(0);

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

    const fetchNotifications = useCallback(async (manual = false) => {
        if (!user || !token) return;

        try {
            setLoading(true);

            const response = await authenticatedFetch('/api/notifications');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Errore: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            const newNotifications = data.notifications || [];

            setNotifications(newNotifications);

            // ✅ Calcola unreadCount localmente per il suono
            const newUnreadCount = newNotifications.filter((n: any) => !n.read).length;

            if (!manual && newUnreadCount > previousUnreadCount.current) {
                playNotificationSound();
            }

            previousUnreadCount.current = newUnreadCount;
        } catch (err: any) {
            console.error('❌ Errore fetch notifiche:', err);
        } finally {
            setLoading(false);
        }
    }, [user, token, authenticatedFetch, setNotifications, setLoading]);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return false;
        }

        if (!user || !token) {
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== 'granted') {
                return false;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    console.error('❌ VAPID public key mancante');
                    return false;
                }


                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    // @ts-ignore
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            }

            const subscriptionData = subscription.toJSON();

            const response = await authenticatedFetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({ subscription: subscriptionData })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            return true;
        } catch (error: any) {
            console.error('❌ Errore richiesta permesso:', error);
            return false;
        }
    }, [user, token, authenticatedFetch, setPermission]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user || !token) return;

        try {
            const response = await authenticatedFetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // ✅ Aggiorna solo notifications, unreadCount si calcola automaticamente
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error('❌ Errore mark as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    const markAllAsRead = useCallback(async () => {
        if (!user || !token) return;

        try {
            const response = await authenticatedFetch('/api/notifications/read-all', {
                method: 'PATCH'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // ✅ Aggiorna solo notifications
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('❌ Errore mark all as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user || !token) return;

        try {
            const response = await authenticatedFetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            // ✅ Aggiorna solo notifications
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('❌ Errore delete notification:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    useEffect(() => {
        if (user && token && !hasInitialized.current) {
            hasInitialized.current = true;
            fetchNotifications(false);

            if (permission === 'granted') {
                requestPermission();
            }
        }

        if ((!user || !token) && hasInitialized.current) {
            hasInitialized.current = false;
            setNotifications([]);
            previousUnreadCount.current = 0;
        }
    }, [user, token, permission, fetchNotifications, requestPermission, setNotifications]);

    useEffect(() => {
        if (!user || !token) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_NOTIFICATION') {
                console.log('🔔 Nuova notifica ricevuta dal SW');
                fetchNotifications(true);
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, [user, token, fetchNotifications]);

    useEffect(() => {
        if (!user || !token) return;

        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [user, token, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        permission,
        requestPermission,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
}
