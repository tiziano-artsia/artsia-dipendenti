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
import { PushNotificationService } from '@/lib/push-notifications';
import { Capacitor } from '@capacitor/core';

const PERMISSION_STORAGE_KEY = 'artsia_notification_permission';
const PERMISSION_REQUESTED_KEY = 'artsia_permission_requested';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function playNotificationSound() {
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch {}
}

function savePermissionToStorage(permission: NotificationPermission) {
    try {
        localStorage.setItem(PERMISSION_STORAGE_KEY, permission);
        if (permission === 'granted' || permission === 'denied') {
            localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
        }
    } catch {}
}

function getPermissionFromStorage(): NotificationPermission | null {
    try {
        const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
        if (stored === 'granted' || stored === 'denied' || stored === 'default') {
            return stored as NotificationPermission;
        }
    } catch {}
    return null;
}

function hasPermissionBeenRequested(): boolean {
    try {
        return localStorage.getItem(PERMISSION_REQUESTED_KEY) === 'true';
    } catch {
        return false;
    }
}

export function useNotifications() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const [permission, setPermission] = useAtom(pushPermissionAtom);
    const unreadCount = useAtomValue(unreadCountAtom);
    const setLoading = useSetAtom(notificationsLoadingAtom);
    const hasInitialized = useRef(false);
    const previousUnreadCount = useRef(0);

    // ── BADGE SYNC ────────────────────────────────────────────
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            PushNotificationService.setBadgeCount(unreadCount);
        }
    }, [unreadCount]);

    // ── DEBUG INFO ────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        console.group(' DEBUG NOTIFICHE - Info Sistema');
        console.log(' Notification API:', 'Notification' in window);
        console.log('⚙ ServiceWorker API:', 'serviceWorker' in navigator);
        console.log(' User Agent:', navigator.userAgent);
        console.log(' Browser permission:', 'Notification' in window ? Notification.permission : 'N/A');
        console.log(' Stored permission:', getPermissionFromStorage());
        console.log(' Capacitor Native:', Capacitor.isNativePlatform());
        console.log(' Platform:', Capacitor.getPlatform());

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true;
        console.log(' iOS:', isIOS);
        console.log(' Android:', isAndroid);
        console.log(' Standalone PWA:', isStandalone);
        console.groupEnd();
    }, []);

    // ── INIT PERMESSO — browser è sempre fonte di verità ─────
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        const browserPermission = Notification.permission;
        const storedPermission = getPermissionFromStorage();

        console.log(' Inizializzazione permesso:');
        console.log('- Stored:', storedPermission);
        console.log('- Browser:', browserPermission);

        if (browserPermission !== 'default') {
            if (storedPermission !== browserPermission) {
                console.warn(`⚠️ Desync: stored=${storedPermission} browser=${browserPermission} → fix`);
                savePermissionToStorage(browserPermission);
            }
            setPermission(browserPermission);
        } else {
            if (storedPermission === 'granted') {
                console.warn('⚠️ localStorage dice granted ma browser dice default → reset');
                savePermissionToStorage('default');
                localStorage.removeItem(PERMISSION_REQUESTED_KEY);
            }
            setPermission('default');
        }

    }, [setPermission]);

    // ── AUTHENTICATED FETCH ───────────────────────────────────
    const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
    }, [token]);

    // ── FETCH NOTIFICHE ───────────────────────────────────────
    const fetchNotifications = useCallback(async (manual = false) => {
        if (!user || !token) return;
        try {
            setLoading(true);
            const response = await authenticatedFetch('/api/notifications');
            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            const newNotifications = data.notifications || [];
            setNotifications(newNotifications);

            const newUnreadCount = newNotifications.filter((n: any) => !n.read).length;
            if (!manual && newUnreadCount > previousUnreadCount.current) {
                playNotificationSound();
            }
            previousUnreadCount.current = newUnreadCount;

            if (Capacitor.isNativePlatform()) {
                await PushNotificationService.setBadgeCount(newUnreadCount);
            }
        } catch (err: any) {
            console.error('❌ Errore fetch notifiche:', err);
        } finally {
            setLoading(false);
        }
    }, [user, token, authenticatedFetch, setNotifications, setLoading]);

    // ── REQUEST PERMISSION ────────────────────────────────────
    const requestPermission = useCallback(async (): Promise<boolean> => {
        console.group('🔔 REQUEST PERMISSION');

        if (!window.isSecureContext) {
            console.error('❌ Contesto non sicuro');
            console.groupEnd();
            return false;
        }

        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            console.error('❌ Browser non supporta notifiche o SW');
            console.groupEnd();
            return false;
        }

        if (!user || !token) {
            console.warn('⚠️ Utente non autenticato');
            console.groupEnd();
            return false;
        }

        const browserPermission = Notification.permission;

        // ← Controlla SEMPRE il browser reale, non il localStorage
        if (browserPermission === 'granted') {
            console.log('✅ Permesso già granted nel browser');
            savePermissionToStorage('granted');
            setPermission('granted');

            try {
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                        console.error('❌ VAPID key mancante');
                        console.groupEnd();
                        return false;
                    }

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        // @ts-ignore
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                    });
                    console.log('✅ Subscription creata');

                    await authenticatedFetch('/api/push/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ subscription: subscription.toJSON() })
                    });
                    console.log('✅ Subscription salvata nel DB');
                } else {
                    console.log('✅ Subscription già esistente');
                }
            } catch (error) {
                console.error('❌ Errore subscription:', error);
            }

            console.groupEnd();
            return true;
        }

        if (browserPermission === 'denied') {
            console.log('⛔ Permesso negato dal browser');
            savePermissionToStorage('denied');
            setPermission('denied');
            console.groupEnd();
            return false;
        }

        // browserPermission === 'default' → chiedi al browser
        try {
            console.log('📢 Richiesta permesso al browser...');
            const result = await Notification.requestPermission();
            console.log('Risultato:', result);

            savePermissionToStorage(result);
            setPermission(result);

            if (result !== 'granted') {
                console.groupEnd();
                return false;
            }

            // Permesso appena ottenuto → subscribe
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('❌ VAPID key mancante');
                console.groupEnd();
                return false;
            }

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    // @ts-ignore
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            }

            const response = await authenticatedFetch('/api/push/subscribe', {
                method: 'POST',
                body: JSON.stringify({ subscription: subscription.toJSON() })
            });

            if (response.ok) {
                console.log('✅ Subscription salvata');
            } else {
                console.error('❌ Errore salvataggio subscription');
            }

            console.groupEnd();
            return true;

        } catch (error: any) {
            console.error('❌ Errore requestPermission:', error.message);
            console.groupEnd();
            return false;
        }
    }, [user, token, authenticatedFetch, setPermission]);

    // ── MARK AS READ ──────────────────────────────────────────
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user || !token) return;
        try {
            await authenticatedFetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
        } catch (error) {
            console.error('❌ Errore mark as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // ── MARK ALL AS READ ──────────────────────────────────────
    const markAllAsRead = useCallback(async () => {
        if (!user || !token) return;
        try {
            await authenticatedFetch('/api/notifications/read-all', { method: 'PATCH' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('❌ Errore mark all as read:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // ── DELETE ────────────────────────────────────────────────
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!user || !token) return;
        try {
            await authenticatedFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('❌ Errore delete:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // ── INIT: fetch + subscribe ───────────────────────────────
    useEffect(() => {
        if (user && token && !hasInitialized.current) {
            hasInitialized.current = true;
            fetchNotifications(false);
            // Tenta sempre subscribe — internamente controlla il browser reale
            requestPermission();
        }

        if ((!user || !token) && hasInitialized.current) {
            hasInitialized.current = false;
            setNotifications([]);
            previousUnreadCount.current = 0;
            if (Capacitor.isNativePlatform()) {
                PushNotificationService.clearBadge();
            }
        }
    }, [user, token, fetchNotifications, requestPermission, setNotifications]);

    // ── SW MESSAGE LISTENER ───────────────────────────────────
    useEffect(() => {
        if (!user || !token) return;

        const handleSWNotification = (event: Event) => {
            fetchNotifications(false);
            playNotificationSound();
        };

        window.addEventListener('sw-notification', handleSWNotification);
        return () => window.removeEventListener('sw-notification', handleSWNotification);
    }, [user, token, fetchNotifications]);

    useEffect(() => {
        if (!user || !token || !('serviceWorker' in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_NOTIFICATION') {
                fetchNotifications(false);
                playNotificationSound();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, [user, token, fetchNotifications]);

    // ── POLLING 30s ───────────────────────────────────────────
    useEffect(() => {
        if (!user || !token) return;
        const interval = setInterval(() => fetchNotifications(true), 30000);
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
        deleteNotification,
        hasPermissionBeenRequested: hasPermissionBeenRequested()
    };
}
