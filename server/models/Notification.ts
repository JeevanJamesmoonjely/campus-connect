import mongoose, { Document, Schema } from 'mongoose';
import { emitToUser } from '../socket';

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    type: 'like' | 'comment' | 'message' | 'follow' | 'club_invite' | 'system';
    title: string;
    message: string;
    read: boolean;
    reference_id?: mongoose.Types.ObjectId;
    reference_type?: string;
    created_at: Date;
}

const notificationSchema = new Schema<INotification>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'message', 'follow', 'club_invite', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
    },
    read: {
        type: Boolean,
        default: false,
    },
    reference_id: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    reference_type: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
});

// Real-time notification emission
notificationSchema.post('save', function(doc: any) {
    emitToUser(doc.user_id.toString(), 'notification', {
        id: doc._id.toString(),
        user_id: doc.user_id.toString(),
        type: doc.type,
        title: doc.title,
        content: doc.message,
        is_read: doc.read,
        created_at: doc.created_at,
    });
});

// Transform output
notificationSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<INotification>('Notification', notificationSchema);
