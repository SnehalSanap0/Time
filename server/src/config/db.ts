import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bridgelinksih_db_user:ijCEydkSfKqE09wz@bridgelink.zbdt3ld.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=BridgeLink';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
