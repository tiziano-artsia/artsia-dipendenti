// lib/models/PushSubscription.ts
import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        index: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
        default: 'web'
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ✅ Indice composto per evitare duplicati
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

// ✅ TTL index: rimuove subscription inattive dopo 90 giorni
PushSubscriptionSchema.index({ lastUsed: 1 }, { expireAfterSeconds: 7776000 }); // 90 giorni

export default mongoose.models.PushSubscription ||
mongoose.model('PushSubscription', PushSubscriptionSchema);
