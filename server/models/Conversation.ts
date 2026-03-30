import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    last_message?: string;
    last_message_at?: Date;
    created_at: Date;
    updated_at: Date;
}

const conversationSchema = new Schema<IConversation>({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    last_message: {
        type: String,
        default: null,
    },
    last_message_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Index for querying user's conversations
conversationSchema.index({ participants: 1 });

// Transform output
conversationSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IConversation>('Conversation', conversationSchema);
