import { PushNotifications } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
    private static listeners: Map<string, ((notification: any) => void)[]> = new Map();

    static async initialize() {
        if (!Capacitor.isNativePlatform()) {
            console.log('⚠️ Push notifications disponibili solo su mobile');
            return;
        }

        try {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('❌ Permessi push notification negati');
                return;
            }

            await PushNotifications.register();
            console.log('✅ Push notifications registrate');

            // ✅ Sincronizza badge con backend
            await this.syncBadgeWithBackend();

            // Listener: Registration success
            await PushNotifications.addListener('registration', async (token) => {
                console.log('📱 Push token:', token.value);

                // ✅ Salva token nel backend
                await this.savePushToken(token.value);
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('❌ Errore registrazione push:', error);
            });

            // Notifica ricevuta (foreground)
            await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('📩 Notifica ricevuta:', notification);

                // ✅ Incrementa badge
                await this.incrementBadge();

                this.triggerListeners('received', notification);
            });

            // Notifica tapped
            await PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
                console.log('👆 Notifica tapped:', notification);

                // ✅ Decrementa badge
                await this.decrementBadge();

                this.triggerListeners('actionPerformed', notification);
            });

        } catch (error) {
            console.error('❌ Errore inizializzazione push:', error);
        }
    }

    // ✅ Salva push token nel backend con JWT
    static async savePushToken(token: string) {
        try {
            // ✅ Recupera JWT token da localStorage
            const jwtToken = localStorage.getItem('token');
            if (!jwtToken) {
                console.warn('⚠️ JWT token non trovato');
                return;
            }

            const response = await fetch('/api/push/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`  // ✅ JWT header
                },
                body: JSON.stringify({ pushToken: token })
            });

            if (response.ok) {
                console.log('✅ Push token salvato nel backend');
            } else {
                console.error('❌ Errore salvataggio push token:', response.status);
            }
        } catch (error) {
            console.error('❌ Errore salvataggio push token:', error);
        }
    }

    // ✅ Sincronizza badge con backend
    static async syncBadgeWithBackend() {
        try {
            const jwtToken = localStorage.getItem('token');
            if (!jwtToken) return;

            const response = await fetch('/api/push/badge', {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            if (response.ok) {
                const { badgeCount } = await response.json();
                await Badge.set({ count: badgeCount });
                console.log(`🔢 Badge sincronizzato: ${badgeCount}`);
            }
        } catch (error) {
            console.error('❌ Errore sync badge:', error);
        }
    }

    // ✅ Set badge (locale + backend)
    static async setBadgeCount(count: number) {
        try {
            if (!Capacitor.isNativePlatform()) return;

            // Locale
            await Badge.set({ count });

            // Backend
            const jwtToken = localStorage.getItem('token');
            if (jwtToken) {
                await fetch('/api/push/badge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify({ count })
                });
            }

            console.log(`🔢 Badge impostato a: ${count}`);
        } catch (error) {
            console.error('❌ Errore set badge:', error);
        }
    }

    // ✅ Incrementa badge
    static async incrementBadge() {
        try {
            if (!Capacitor.isNativePlatform()) return;

            const result = await Badge.get();
            const newCount = (result.count || 0) + 1;
            await this.setBadgeCount(newCount);
        } catch (error) {
            console.error('❌ Errore incremento badge:', error);
        }
    }

    // ✅ Decrementa badge
    static async decrementBadge() {
        try {
            if (!Capacitor.isNativePlatform()) return;

            const result = await Badge.get();
            const newCount = Math.max(0, (result.count || 0) - 1);
            await this.setBadgeCount(newCount);
        } catch (error) {
            console.error('❌ Errore decremento badge:', error);
        }
    }

    // ✅ Clear badge
    static async clearBadge() {
        await this.setBadgeCount(0);
    }

    static addListener(event: string, callback: (notification: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    private static triggerListeners(event: string, notification: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((callback) => callback(notification));
        }
    }

    static async removeAllListeners() {
        await PushNotifications.removeAllListeners();
        this.listeners.clear();
    }
}
