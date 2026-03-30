import mongoose, { Document, Schema } from 'mongoose';

export interface IClubMembership {
    user_id: mongoose.Types.ObjectId;
    role: 'admin' | 'moderator' | 'member';
    joined_at: Date;
}

export interface IClub extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    image_url?: string;
    category: string;
    created_by: mongoose.Types.ObjectId;
    members: IClubMembership[];
    member_count: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const clubMembershipSchema = new Schema<IClubMembership>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'moderator', 'member'],
        default: 'member',
    },
    joined_at: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const clubSchema = new Schema<IClub>({
    name: {
        type: String,
        required: [true, 'Club name is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    image_url: {
        type: String,
        default: null,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [clubMembershipSchema],
    is_active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for member count
clubSchema.virtual('member_count').get(function() {
    return this.members?.length || 0;
});

// Transform output
clubSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IClub>('Club', clubSchema);
