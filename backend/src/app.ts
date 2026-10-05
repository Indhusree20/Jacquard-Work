import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { ENV } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false // allow serving images/files cross-origin
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or localhost/127.0.0.1
      if (!origin || ENV.NODE_ENV === 'development' || origin === ENV.CLIENT_URL || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded design files statically
app.use('/uploads', express.static(path.resolve(__dirname, '../', ENV.UPLOAD_DIR)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Jacquard Work Management API', timestamp: new Date() });
});

// Mount all API routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
