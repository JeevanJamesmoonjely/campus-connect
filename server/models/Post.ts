import mongoose, { Document, Schema } from 'mongoose';

export interface IPostComment {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    content: string;
    created_at: Date;
}

export interface IPost extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    content: string;
    image_url?: string;
    club_id?: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    comments: IPostComment[];
    likes_count: number;
    comments_count: number;
    created_at: Date;
    updated_at: Date;
}

const postCommentSchema = new Schema<IPostComment>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const postSchema = new Schema<IPost>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        default: '',
    },
    image_url: {
        type: String,
        default: null,
    },
    club_id: {
        type: Schema.Types.ObjectId,
        ref: 'Club',
        default: null,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    comments: [postCommentSchema],
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toObject: { virtuals: true },
});

// Virtual for likes count
postSchema.virtual('likes_count').get(function() {
    return this.likes?.length || 0;
});

// Virtual for comments count
postSchema.virtual('comments_count').get(function() {
    return this.comments?.length || 0;
});

// Transform output - virtuals must be enabled here too
postSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc: any, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model<IPost>('Post', postSchema);
