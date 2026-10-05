import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { SocketService } from './services/SocketService';
import { seedDatabase } from './seeds/seed';

const startServer = async () => {
  try {
    await connectDB();
    
    // Automatically seed if database is fresh
    await seedDatabase();

    const server = http.createServer(app);
    SocketService.init(server);

    server.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Jacquard Work Management API is running!`);
      console.log(`🌐 Server Port: http://localhost:${ENV.PORT}`);
      console.log(`📡 Socket.IO: Initialized`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
