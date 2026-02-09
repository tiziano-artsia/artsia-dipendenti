// lib/push-notifications.ts
import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    type Token,
    type PushNotificationSchema,
    type ActionPerformed
} from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class PushNotificationService {
    private static token: string | null = null;
    private static isInitialized = false;

    // ✅ Inizializza Push (auto-detect PWA vs Native)
    static async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Push già inizializzate');
            return;
        }

        this.isInitialized = true;

        if (Capacitor.isNativePlatform()) {
            console.log('📱 Inizializzazione Push Nativo...');
            await this.initNativePush();
        } else if ('serviceWorker' in navigator && 'PushManager' in window) {
            console.log('🌐 Inizializzazione Push Web (PWA)...');
            await this.initWebPush();
        } else {
            console.warn('⚠️ Push notifications non supportate');
        }
    }

    // ========================================
    // NATIVE PUSH (iOS/Android)
    // ========================================

    private static async initNativePush() {
        try {
            // 1. Controlla permessi
            let permStatus = await PushNotifications.checkPermissions();
            console.log('🔐 Permessi attuali:', permStatus.receive);

            if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('⚠️ Permessi push negati');
                return;
            }

            console.log('✅ Permessi push garantiti');

            // 2. Registra device
            await PushNotifications.register();
            console.log('📝 Registrazione push richiesta...');

            // 3. LISTENER: Token ricevuto (APNs per iOS, FCM per Android)
            await PushNotifications.addListener('registration', async (token: Token) => {
                console.log('✅ Push token ricevuto:', token.value);
                this.token = token.value;
                await this.sendTokenToBackend(token.value, Capacitor.getPlatform());
            });

            // 4. LISTENER: Errore registrazione
            await PushNotifications.addListener('registrationError', (error: any) => {
                console.error('❌ Errore registrazione push:', error);
            });

            // 5. LISTENER: Notifica ricevuta mentre app è in FOREGROUND
            await PushNotifications.addListener(
                'pushNotificationReceived',
                async (notification: PushNotificationSchema) => {
                    console.log('🔔 Push ricevuta (foreground):', notification);

                    // Vibrazione
                    await this.vibrate();

                    // Mostra toast in-app (perché iOS non mostra notifiche quando app è aperta)
                    this.showInAppNotification(notification);

                    // Aggiorna UI (badge, lista notifiche)
                    this.updateUI(notification);
                }
            );

            // 6. LISTENER: Utente ha tappato la notifica
            await PushNotifications.addListener(
                'pushNotificationActionPerformed',
                async (action: ActionPerformed) => {
                    console.log('👆 Notifica tappata:', action);

                    const data = action.notification.data;
                    const notificationId = data?.notificationId;
                    const url = data?.url || '/dashboard';

                    // Segna come letta
                    if (notificationId) {
                        await this.markAsRead(notificationId);
                    }

                    // Naviga alla pagina
                    setTimeout(() => {
                        window.location.href = url;
                    }, 100);
                }
            );

            console.log('✅ Push Notifications Native configurate');

        } catch (error) {
            console.error('❌ Errore init push nativo:', error);
        }
    }

    // ========================================
    // WEB PUSH (PWA con Service Worker)
    // ========================================

    private static async initWebPush() {
        try {
            // Registra Service Worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registrato');

            await navigator.serviceWorker.ready;

            // Richiedi permessi
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                console.warn('⚠️ Permessi notifiche negati');
                return;
            }

            console.log('✅ Permessi notifiche garantiti');

            // Sottoscrivi a Web Push (se hai VAPID key)
            if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                    )
                });

                console.log('✅ Sottoscrizione push:', subscription);
                await this.sendWebPushSubscription(subscription);
            }

            // Listener messaggi dal Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('📨 Messaggio da SW:', event.data);

                if (event.data.type === 'NEW_NOTIFICATION') {
                    this.updateUI(event.data.notification);
                }

                if (event.data.type === 'PLAY_SOUND') {
                    window.dispatchEvent(new Event('playNotificationSound'));
                }
            });

        } catch (error) {
            console.error('❌ Errore init push web:', error);
        }
    }

    // ========================================
    // BACKEND COMMUNICATION
    // ========================================

    // Invia token nativo al backend
    private static async sendTokenToBackend(token: string, platform: string) {
        try {
            const authToken = localStorage.getItem('token');

            if (!authToken) {
                console.warn('⚠️ Nessun token auth - rimando invio device token');
                return;
            }

            const response = await fetch('/api/notifications/register-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    token,
                    platform,
                    deviceInfo: {
                        model: Capacitor.getPlatform(),
                        version: navigator.userAgent
                    }
                })
            });

            if (response.ok) {
                console.log('✅ Device token inviato al backend');
            } else {
                console.error('❌ Errore invio token:', await response.text());
            }
        } catch (error) {
            console.error('❌ Errore invio token:', error);
        }
    }

    // Invia subscription web push al backend
    private static async sendWebPushSubscription(subscription: PushSubscription) {
        try {
            const authToken = localStorage.getItem('token');

            if (!authToken) {
                console.warn('⚠️ Nessun token auth');
                return;
            }

            const response = await fetch('/api/notifications/register-web-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                console.log('✅ Web Push subscription salvata');
            }
        } catch (error) {
            console.error('❌ Errore salvataggio web push:', error);
        }
    }

    // Segna notifica come letta
    private static async markAsRead(notificationId: string) {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) return;

            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            console.log('✅ Notifica segnata come letta');
        } catch (error) {
            console.error('❌ Errore mark as read:', error);
        }
    }

    // ========================================
    // UI HELPERS
    // ========================================

    // Mostra toast in-app per notifiche in foreground
    private static showInAppNotification(notification: any) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-white shadow-2xl rounded-2xl p-4 max-w-sm z-[9999] animate-slide-in border-l-4 border-emerald-500';
        toast.style.animation = 'slideInRight 0.3s ease-out';

        toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
          <span class="text-xl">🔔</span>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-zinc-800 text-sm">${notification.title || 'Notifica'}</h4>
          <p class="text-zinc-600 text-xs mt-1">${notification.body || ''}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-zinc-400 hover:text-zinc-600 text-lg leading-none">
          ✕
        </button>
      </div>
    `;

        document.body.appendChild(toast);

        // Auto-remove dopo 5 secondi
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Vibrazione/haptic feedback
    private static async vibrate() {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
                console.warn('⚠️ Haptics non disponibile');
            }
        } else if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
    }

    // Invia evento per aggiornare UI (badge, lista notifiche)
    private static updateUI(notification: any) {
        window.dispatchEvent(new CustomEvent('newNotification', {
            detail: notification
        }));
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    // Helper per convertire VAPID key
    private static urlBase64ToUint8Array(base64String: string): Uint8Array {
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

    // ========================================
    // PUBLIC API
    // ========================================

    // Ottieni badge count dal backend
    static async getBadgeCount(): Promise<number> {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) return 0;

            const response = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.count || 0;
            }
        } catch (error) {
            console.error('❌ Errore badge count:', error);
        }
        return 0;
    }

    // Ottieni token push corrente
    static getToken(): string | null {
        return this.token;
    }

    // Reset (per logout)
    static async reset() {
        if (Capacitor.isNativePlatform()) {
            try {
                await PushNotifications.removeAllListeners();
            } catch (error) {
                console.warn('⚠️ Errore rimozione listeners:', error);
            }
        }
        this.token = null;
        this.isInitialized = false;
    }
}
