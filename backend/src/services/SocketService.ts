import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ENV } from '../config/env';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static init(server: HTTPServer): SocketIOServer {
    SocketService.io = new SocketIOServer(server, {
      cors: {
        origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    SocketService.io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      // Allow client to join role and user specific rooms
      socket.on('join', (data: { userId?: string; role?: string }) => {
        if (data.userId) {
          socket.join(`user:${data.userId}`);
          console.log(`[Socket.IO] Socket ${socket.id} joined user room user:${data.userId}`);
        }
        if (data.role) {
          socket.join(`role:${data.role}`);
          console.log(`[Socket.IO] Socket ${socket.id} joined role room role:${data.role}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return SocketService.io;
  }

  public static getIO(): SocketIOServer | null {
    return SocketService.io;
  }

  public static emitToUser(userId: string, event: string, payload: any): void {
    if (SocketService.io) {
      SocketService.io.to(`user:${userId}`).emit(event, payload);
    }
  }

  public static emitToRole(role: string, event: string, payload: any): void {
    if (SocketService.io) {
      SocketService.io.to(`role:${role}`).emit(event, payload);
    }
  }

  public static broadcast(event: string, payload: any): void {
    if (SocketService.io) {
      SocketService.io.emit(event, payload);
    }
  }
}
