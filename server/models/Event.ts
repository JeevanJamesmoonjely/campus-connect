import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    image_url?: string;
    attendees_count: number;
    created_by: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const eventSchema = new Schema<IEvent>({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    date: {
        type: String,
        required: [true, 'Date is required'],
    },
    time: {
        type: String,
        required: [true, 'Time is required'],
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    image_url: {
        type: String,
        default: null,
    },
    attendees_count: {
        type: Number,
        default: 0,
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Transform output
eventSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IEvent>('Event', eventSchema);
