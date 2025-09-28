import mongoose from 'mongoose';

// MongoDB Atlas connection string with your credentials
// NOTE: You need to replace this with your actual MongoDB Atlas cluster URL
// Get the correct URL from your MongoDB Atlas dashboard
const MONGODB_URI = `mongodb+srv://bridgelinksih_db_user:ijCEydkSfKqE09wz@bridgelink.zbdt3ld.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=BridgeLink`;// Instructions for getting the correct connection string:
// 1. Go to https://cloud.mongodb.com/
// 2. Sign in to your MongoDB Atlas account
// 3. Click on "Connect" for your cluster
// 4. Choose "Connect your application"
// 5. Copy the connection string and replace the one above

let isConnected = false;

export const connectToMongoDB = async (): Promise<void> => {
  try {
    // Check if already connected using our flag
    if (isConnected) {
      console.log('Already connected to MongoDB Atlas');
      return;
    }

    console.log('Connecting to MongoDB Atlas...');
    console.log('🔗 If connection fails, please update the MongoDB URI in src/config/mongodb.ts');
    
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('✅ Connected to MongoDB Atlas successfully');
      isConnected = true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ MongoDB connection failed: ${errorMessage}`);
      console.error('📋 To fix this:');
      console.error('1. Go to https://cloud.mongodb.com/');
      console.error('2. Sign in to your MongoDB Atlas account');
      console.error('3. Click "Connect" on your cluster');
      console.error('4. Choose "Connect your application"');
      console.error('5. Copy the connection string');
      console.error('6. Replace the MONGODB_URI in src/config/mongodb.ts');
      
      isConnected = false;
      throw new Error(`MongoDB Atlas connection failed: ${errorMessage}`);
    }
    
    // Handle connection events only if connection exists
    if (mongoose.connection) {
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        isConnected = false;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        isConnected = true;
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    isConnected = false;
    throw error;
  }
};

export const disconnectFromMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  } catch (error) {
    console.error('Error disconnecting from MongoDB Atlas:', error);
    throw error;
  }
};

export default mongoose;
