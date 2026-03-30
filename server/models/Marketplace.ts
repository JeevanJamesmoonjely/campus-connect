import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketplace extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: 'new' | 'like_new' | 'good' | 'fair';
    image_url?: string;
    status: 'available' | 'sold' | 'reserved';
    contact_info?: string;
    created_at: Date;
    updated_at: Date;
}

const marketplaceSchema = new Schema<IMarketplace>({
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
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair'],
        required: [true, 'Condition is required'],
    },
    image_url: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved'],
        default: 'available',
    },
    contact_info: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Transform output
marketplaceSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IMarketplace>('Marketplace', marketplaceSchema);
