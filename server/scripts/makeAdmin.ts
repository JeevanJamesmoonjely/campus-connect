import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const makeAdmin = async (email: string) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-connect');
        console.log('Connected to MongoDB');

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { is_admin: true },
            { new: true }
        );

        if (!user) {
            console.log(`User with email "${email}" not found`);
            process.exit(1);
        }

        console.log(`Successfully made "${user.name}" (${user.email}) an admin!`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log('Usage: npx tsx server/scripts/makeAdmin.ts <email>');
    console.log('Example: npx tsx server/scripts/makeAdmin.ts admin@college.edu');
    process.exit(1);
}

makeAdmin(email);
