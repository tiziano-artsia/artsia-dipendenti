import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { PushNotificationService } from '@/lib/push-notifications';

export interface Notification {
    _id: string;
    userId: string;
    type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'permit_request' | 'permit_approved' | 'permit_rejected';
    title: string;
    body: string;
    relatedRequestId?: string;
    read: boolean;
    createdAt: string;
}

// Atom per le notifiche
export const notificationsAtom = atom<Notification[]>([]);

// Atom per il conteggio non lette
export const unreadCountAtom = atom((get) => {
    const notifications = get(notificationsAtom);
    return notifications.filter(n => !n.read).length;
});

// ✅ Atom per sincronizzare badge con unread count
export const syncBadgeAtom = atom(
    null,
    async (get, set) => {
        const unreadCount = get(unreadCountAtom);

        // Sincronizza badge iOS/Android
        await PushNotificationService.setBadgeCount(unreadCount);

        console.log(`🔢 Badge sincronizzato: ${unreadCount}`);
    }
);

// Atom per lo stato del permesso push
export const pushPermissionAtom = atomWithStorage<NotificationPermission>(
    'artsia-push-permission',
    'default'
);

// Atom per lo stato di loading
export const notificationsLoadingAtom = atom(false);

// Atom per mostrare/nascondere il dropdown
export const notificationDropdownAtom = atom(false);
