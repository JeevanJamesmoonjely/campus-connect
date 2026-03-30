import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    department: string;
    avatar_url?: string;
    bio?: string;
    year?: number;
    reg_number?: string;
    is_admin: boolean;
    created_at: Date;
    updated_at: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
    },
    avatar_url: {
        type: String,
        default: null,
    },
    bio: {
        type: String,
        default: null,
    },
    year: {
        type: Number,
        default: null,
    },
    reg_number: {
        type: String,
        default: null,
        trim: true,
    },
    is_admin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
userSchema.set('toJSON', {
    transform: function(doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
    }
});

export default mongoose.model<IUser>('User', userSchema);
