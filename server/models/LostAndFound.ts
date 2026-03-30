import mongoose, { Document, Schema } from 'mongoose';

export interface ILostAndFound extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    category?: string;
    type: 'lost' | 'found';
    location: string;
    image_url?: string;
    status: 'active' | 'resolved';
    contact_info?: string;
    created_at: Date;
    updated_at: Date;
}

const lostAndFoundSchema = new Schema<ILostAndFound>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: [true, 'Type is required'],
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    category: {
        type: String,
        default: null,
    },
    image_url: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active',
    },
    contact_info: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Transform output
lostAndFoundSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<ILostAndFound>('LostAndFound', lostAndFoundSchema);
