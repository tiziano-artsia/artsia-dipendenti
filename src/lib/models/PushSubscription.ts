import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
    userId: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
    createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
    userId: {
        type: String,  // String type
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userAgent: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 90
    }
}, {
    strict: true,          // ← AGGIUNGI QUESTO
    strictQuery: false     // ← AGGIUNGI QUESTO
});

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

//  ELIMINA IL MODELLO SE GIÀ ESISTE (importante per hot reload)
if (mongoose.models.PushSubscription) {
    delete mongoose.models.PushSubscription;
}

const PushSubscription: Model<IPushSubscription> =
    mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;
