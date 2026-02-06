// components/NotificationSound.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export function NotificationSound() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Crea elemento audio
        const audio = new Audio('/sound/notification.mp3');
        audio.volume = 0.5;
        audio.preload = 'auto';

        // Gestisci caricamento
        audio.addEventListener('canplaythrough', () => {
            console.log('✅ Audio caricato e pronto');
            setIsReady(true);
        });

        audio.addEventListener('error', (e) => {
            console.error('❌ Errore caricamento audio:', e);
        });

        audioRef.current = audio;

        // Inizializza audio al primo click/tap dell'utente
        const initAudio = () => {
            if (audioRef.current && !isReady) {
                console.log('🔊 Inizializzazione audio (primo click utente)');
                audioRef.current.play()
                    .then(() => {
                        audioRef.current?.pause();
                        audioRef.current!.currentTime = 0;
                        setIsReady(true);
                        console.log('✅ Audio inizializzato');
                    })
                    .catch(err => {
                        console.warn('⚠️ Impossibile inizializzare audio:', err);
                    });
            }
            // Rimuovi listener dopo il primo click
            document.removeEventListener('click', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };

        // Ascolta primo click/tap
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });

        // Ascolta messaggi dal service worker
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PLAY_SOUND') {
                console.log('🔊 Ricevuto comando PLAY_SOUND, isReady:', isReady);

                if (audioRef.current) {
                    audioRef.current.currentTime = 0; // Reset
                    audioRef.current.play()
                        .then(() => console.log('✅ Suono riprodotto'))
                        .catch(err => {
                            console.warn('⚠️ Errore riproduzione:', err.message);
                            // Fallback: usa beep sintetico
                            playBeep();
                        });
                }
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleMessage);
            document.removeEventListener('click', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };
    }, [isReady]);

    // Fallback: beep sintetico
    const playBeep = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Primo beep
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            osc1.frequency.value = 800;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            osc1.start(audioContext.currentTime);
            osc1.stop(audioContext.currentTime + 0.15);

            // Secondo beep
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            osc2.start(audioContext.currentTime + 0.2);
            osc2.stop(audioContext.currentTime + 0.35);

            console.log('🔊 Beep fallback riprodotto');
        } catch (err) {
            console.warn('⚠️ Errore beep fallback:', err);
        }
    };

    return null;
}
