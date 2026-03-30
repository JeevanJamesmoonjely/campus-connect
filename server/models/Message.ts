import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    conversation_id: mongoose.Types.ObjectId;
    sender_id: mongoose.Types.ObjectId;
    content: string;
    read: boolean;
    created_at: Date;
}

const messageSchema = new Schema<IMessage>({
    conversation_id: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
});

// Transform output
messageSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IMessage>('Message', messageSchema);
