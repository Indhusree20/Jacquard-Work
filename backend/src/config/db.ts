import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    // Attempt standard connection first
    mongoose.set('strictQuery', false);
    
    // Set a quick timeout for initial check if standard Mongo is running
    const connectPromise = mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });

    await connectPromise;
    console.log(`[MongoDB] Connected successfully to ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to standard URI (${ENV.MONGODB_URI}).`);
    console.log(`[MongoDB] Initializing in-memory Mongo server for zero-setup execution...`);
    
    try {
      mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Connected successfully to In-Memory MongoDB at ${inMemoryUri}`);
    } catch (inMemErr) {
      console.error('[MongoDB] Fatal error initializing MongoDB:', inMemErr);
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('[MongoDB] Error disconnecting:', err);
  }
};
