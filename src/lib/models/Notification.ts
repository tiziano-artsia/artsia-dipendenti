import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
    | 'leave_request'
    | 'leave_approved'
    | 'leave_rejected'
    | 'permit_request'
    | 'permit_approved'
    | 'permit_rejected';

export interface INotification extends Document {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedRequestId?: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'leave_request',
            'leave_approved',
            'leave_rejected',
            'permit_request',
            'permit_approved',
            'permit_rejected'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    relatedRequestId: {
        type: String,
        required: false
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    strict: true,          // ← AGGIUNGI QUESTO
    strictQuery: false     // ← AGGIUNGI QUESTO
});

// Index composti per query efficienti
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

// ✅ ELIMINA IL MODELLO SE GIÀ ESISTE
if (mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

const Notification: Model<INotification> =
    mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
