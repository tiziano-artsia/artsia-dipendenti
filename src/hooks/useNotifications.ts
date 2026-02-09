// hooks/useNotifications.ts - VERSIONE CON DEBUG COMPLETO

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

// ✅ Chiavi localStorage
const PERMISSION_STORAGE_KEY = 'artsia_notification_permission';
const PERMISSION_REQUESTED_KEY = 'artsia_permission_requested';

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

// ✅ Salva permesso in localStorage
function savePermissionToStorage(permission: NotificationPermission) {
    try {
        localStorage.setItem(PERMISSION_STORAGE_KEY, permission);
        if (permission === 'granted' || permission === 'denied') {
            localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
        }
        console.log('💾 Permesso salvato in localStorage:', permission);
    } catch (error) {
        console.warn('⚠️ Impossibile salvare in localStorage');
    }
}

// ✅ Leggi permesso da localStorage
function getPermissionFromStorage(): NotificationPermission | null {
    try {
        const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
        if (stored === 'granted' || stored === 'denied' || stored === 'default') {
            return stored as NotificationPermission;
        }
    } catch (error) {
        console.warn('⚠️ Impossibile leggere da localStorage');
    }
    return null;
}

// ✅ Verifica se il permesso è già stato richiesto
function hasPermissionBeenRequested(): boolean {
    try {
        return localStorage.getItem(PERMISSION_REQUESTED_KEY) === 'true';
    } catch (error) {
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

    // ✅ Debug info all'avvio
    useEffect(() => {
        if (typeof window === 'undefined') return;

        console.group('🔍 DEBUG NOTIFICHE - Info Sistema');
        console.log('📍 Hostname:', window.location.hostname);
        console.log('🔒 Protocol:', window.location.protocol);
        console.log('🔐 isSecureContext:', window.isSecureContext);
        console.log('🔔 Notification API:', 'Notification' in window);
        console.log('⚙️ ServiceWorker API:', 'serviceWorker' in navigator);
        console.log('📱 User Agent:', navigator.userAgent);
        console.log('🌐 Browser permission:', 'Notification' in window ? Notification.permission : 'N/A');
        console.log('💾 Stored permission:', getPermissionFromStorage());

        // Rileva piattaforma
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true;
        console.log('📱 iOS:', isIOS);
        console.log('🤖 Android:', isAndroid);
        console.log('📲 Standalone PWA:', isStandalone);

        if (isIOS) {
            // Estrai versione iOS
            const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
            if (match) {
                const version = `${match[1]}.${match[2]}`;
                console.log('📱 iOS Version:', version);
                const majorVersion = parseInt(match[1]);
                if (majorVersion < 16) {
                    console.warn('⚠️ iOS < 16.4 non supporta Web Push Notifications!');
                } else if (majorVersion === 16 && parseInt(match[2]) < 4) {
                    console.warn('⚠️ iOS 16.0-16.3 non supporta Web Push Notifications! Serve iOS 16.4+');
                }
            }
        }

        console.groupEnd();
    }, []);

    // ✅ Inizializza permesso da localStorage all'avvio
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        const storedPermission = getPermissionFromStorage();
        const browserPermission = Notification.permission;

        console.log('🔄 Inizializzazione permesso:');
        console.log('- Stored:', storedPermission);
        console.log('- Browser:', browserPermission);

        if (storedPermission) {
            setPermission(storedPermission);
            console.log('✅ Permesso caricato da localStorage:', storedPermission);
        } else if (browserPermission !== 'default') {
            setPermission(browserPermission);
            savePermissionToStorage(browserPermission);
            console.log('✅ Permesso caricato dal browser:', browserPermission);
        } else if (browserPermission === 'default' && storedPermission === 'granted') {
            setPermission('granted');
            console.log('✅ Permesso ripristinato da localStorage (iOS fix)');
        } else {
            setPermission(browserPermission);
        }
    }, [setPermission]);

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
        console.group('🔔 REQUEST PERMISSION - START');

        // ✅ Verifica prerequisiti
        console.log('1️⃣ Verifica prerequisiti...');

        if (!window.isSecureContext) {
            console.error('❌ ERRORE: Contesto NON sicuro!');
            console.error('   Serve HTTPS o localhost');
            console.error('   Attuale:', window.location.protocol + '//' + window.location.hostname);
            alert('⚠️ Le notifiche richiedono HTTPS o localhost.\nAttualmente sei su: ' + window.location.protocol);
            console.groupEnd();
            return false;
        }

        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            console.error('❌ Browser non supporta notifiche o Service Worker');
            console.groupEnd();
            return false;
        }

        if (!user || !token) {
            console.warn('⚠️ Utente non autenticato');
            console.groupEnd();
            return false;
        }

        console.log('✅ Prerequisiti OK');
        console.log('   - Secure context:', window.isSecureContext);
        console.log('   - Notification API:', true);
        console.log('   - ServiceWorker API:', true);
        console.log('   - User authenticated:', true);

        // ✅ Verifica permesso salvato
        console.log('2️⃣ Verifica permesso salvato...');
        const storedPermission = getPermissionFromStorage();
        console.log('   Stored permission:', storedPermission);

        if (storedPermission === 'granted') {
            console.log('✅ Permesso già concesso (da localStorage)');
            setPermission('granted');

            try {
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();
                console.log('   Subscription esistente:', !!subscription);

                if (!subscription) {
                    console.log('   Creazione nuova subscription...');
                    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                        console.error('❌ VAPID public key mancante');
                        console.groupEnd();
                        return false;
                    }

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                    });
                    console.log('✅ Subscription creata');

                    await authenticatedFetch('/api/notifications/register-device', {
                        method: 'POST',
                        body: JSON.stringify({ subscription: subscription.toJSON() })
                    });
                    console.log('✅ Device registrato');
                }
            } catch (error) {
                console.error('❌ Errore registrazione subscription:', error);
            }

            console.groupEnd();
            return true;
        }

        if (storedPermission === 'denied') {
            console.log('⛔ Permesso già negato in precedenza');
            console.groupEnd();
            return false;
        }

        // ✅ Richiesta permesso
        try {
            console.log('3️⃣ Richiesta permesso al browser...');
            console.log('   Permission PRIMA della richiesta:', Notification.permission);

            const result = await Notification.requestPermission();

            console.log('   Permission DOPO la richiesta:', result);
            console.log('   Browser Notification.permission:', Notification.permission);

            // ✅ Gestisci i 3 casi
            if (result === 'granted') {
                console.log('✅ GRANTED - Permesso concesso!');
                savePermissionToStorage('granted');
                setPermission('granted');
            } else if (result === 'denied') {
                console.error('❌ DENIED - Permesso negato!');
                console.error('   Possibili cause:');
                console.error('   1. Hai cliccato "Blocca" o "Non consentire"');
                console.error('   2. iOS < 16.4 (controlla versione iOS sopra)');
                console.error('   3. Non sei su HTTPS/localhost');
                console.error('   4. Permesso bloccato nelle impostazioni browser');
                savePermissionToStorage('denied');
                setPermission('denied');
                console.groupEnd();
                return false;
            } else if (result === 'default') {
                console.warn('⚠️ DEFAULT - Utente ha ignorato il popup (iOS)');
                setPermission('default');
                // NON salvare in localStorage
                console.groupEnd();
                return false;
            }

            if (result !== 'granted') {
                console.groupEnd();
                return false;
            }

            console.log('4️⃣ Registrazione Service Worker...');
            const registration = await navigator.serviceWorker.ready;
            console.log('   ServiceWorker ready:', registration.scope);

            let subscription = await registration.pushManager.getSubscription();
            console.log('   Subscription esistente:', !!subscription);

            if (!subscription) {
                console.log('   Creazione subscription...');
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    console.error('❌ VAPID public key mancante in .env.local');
                    console.error('   Aggiungi: NEXT_PUBLIC_VAPID_PUBLIC_KEY=...');
                    console.groupEnd();
                    return false;
                }

                console.log('   VAPID key presente:', vapidPublicKey.substring(0, 20) + '...');

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });

                console.log('✅ Subscription creata:', subscription.endpoint);
            }

            console.log('5️⃣ Registrazione device su server...');
            const subscriptionData = subscription.toJSON();

            const response = await authenticatedFetch('/api/notifications/register-device', {
                method: 'POST',
                body: JSON.stringify({ subscription: subscriptionData })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Errore API:', error);
                throw new Error(`Errore: ${error.error || response.statusText}`);
            }

            const responseData = await response.json();
            console.log('✅ Device registrato con successo:', responseData);
            console.groupEnd();
            return true;
        } catch (error: any) {
            console.error('❌ ERRORE durante requestPermission:');
            console.error('   Name:', error.name);
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);

            // Fallback: verifica se il browser ha comunque granted
            if (Notification.permission === 'granted') {
                console.log('⚠️ Errore ma permesso browser è "granted", salvo comunque');
                savePermissionToStorage('granted');
                setPermission('granted');
                console.groupEnd();
                return true;
            }

            console.groupEnd();
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

            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('❌ Errore delete notification:', error);
        }
    }, [user, token, authenticatedFetch, setNotifications]);

    // ✅ Inizializzazione
    useEffect(() => {
        if (user && token && !hasInitialized.current) {
            hasInitialized.current = true;
            fetchNotifications(false);

            const storedPermission = getPermissionFromStorage();
            if (storedPermission === 'granted') {
                requestPermission();
            }
        }

        if ((!user || !token) && hasInitialized.current) {
            hasInitialized.current = false;
            setNotifications([]);
            previousUnreadCount.current = 0;
        }
    }, [user, token, fetchNotifications, requestPermission, setNotifications]);

    // ✅ Listener per messaggi dal Service Worker
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

    // ✅ Polling ogni 30 secondi
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
        deleteNotification,
        hasPermissionBeenRequested: hasPermissionBeenRequested()
    };
}
