'use client';

import { useEffect } from 'react';
import { PushNotificationService } from '@/lib/push-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function CapacitorInitializer() {
    useEffect(() => {
        console.log('🚀 Inizializzazione Capacitor...');
        console.log('📱 Piattaforma:', Capacitor.getPlatform());
        console.log('🔧 Native:', Capacitor.isNativePlatform());

        // ✅ Inizializza push notifications
        PushNotificationService.initialize();

        // ✅ Configura StatusBar (solo native)
        if (Capacitor.isNativePlatform()) {
            try {
                StatusBar.setStyle({ style: Style.Light });
                StatusBar.setBackgroundColor({ color: '#662D87' });
            } catch (error) {
                console.warn('StatusBar non disponibile:', error);
            }

            // Listener app state
            App.addListener('appStateChange', ({ isActive }) => {
                console.log('📱 App state:', isActive ? 'foreground' : 'background');

                if (isActive) {
                    // App tornata in foreground - ricarica notifiche
                    window.dispatchEvent(new Event('appResumed'));
                }
            });

            // Listener back button Android
            App.addListener('backButton', ({ canGoBack }) => {
                console.log('🔙 Back button:', canGoBack);

                if (!canGoBack) {
                    App.exitApp();
                } else {
                    window.history.back();
                }
            });

            // Listener URL aperti (deep links)
            App.addListener('appUrlOpen', (data) => {
                console.log('🔗 Deep link:', data.url);
                // Gestisci deep links se necessario
            });
        }

        return () => {
            if (Capacitor.isNativePlatform()) {
                App.removeAllListeners();
            }
        };
    }, []);

    return null;
}
